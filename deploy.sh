#!/usr/bin/env bash
#
# Quit Hero — AWS EC2 deployment script
#
# Usage (on EC2, from project root):
#   chmod +x deploy.sh
#   ./deploy.sh
#
# First-time server setup:
#   ./deploy.sh --setup
#
# Deploy from your laptop to EC2:
#   EC2_HOST=ubuntu@54.153.95.239 ./deploy.sh --remote
#
# Optional env vars (set in .env or export before running):
#   APP_DIR          Install path on server (default: /opt/quithero)
#   EC2_HOST         SSH target for --remote (e.g. ubuntu@54.153.95.239)
#   EC2_SSH_KEY      Path to .pem key (default: ./quithero.pem in project root)
#   EC2_SSH_USER     SSH login user (default: ec2-user for Amazon Linux)
#   GIT_BRANCH       Branch to deploy (default: main)
#   PB_PORT          PocketBase port (default: 8096)
#   FRONTEND_PORT    nginx port for user app (default: 80)
#   BACKOFFICE_PORT  nginx port for admin app (default: 8080)
#   AI_PROXY_PORT    Local AI proxy port (default: 8787)
#   PUBLIC_URL       Public base URL for builds (default: http://<server-ip>)
#   SKIP_PB_SETUP    Set to 1 to skip PocketBase schema setup scripts
#   PB_DATA_DIR      Persistent DB path on server (default: /var/lib/quithero/pb_data)
#   PB_BACKUP_DIR    Backup location (default: /var/lib/quithero/backups)
#   PB_ENCRYPTION_KEY 32-char key for PocketBase Docker (see docker-compose.yml)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-/opt/quithero}"
GIT_BRANCH="${GIT_BRANCH:-main}"
PB_PORT="${PB_PORT:-8096}"
FRONTEND_PORT="${FRONTEND_PORT:-80}"
BACKOFFICE_PORT="${BACKOFFICE_PORT:-8080}"
AI_PROXY_PORT="${AI_PROXY_PORT:-8787}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-quithero}"
SKIP_PB_SETUP="${SKIP_PB_SETUP:-0}"

log()  { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

load_env_file() {
  local env_file="$1"
  [[ -f "$env_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    line="${line#export }"
    [[ "$line" != *"="* ]] && continue

    # Split on first '=' only (URLs contain additional '=' characters)
    local key="${line%%=*}"
    local value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]*}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]*}"}"

    if [[ "$value" =~ ^\".*\"$ ]]; then
      value="${value%\"}"
      value="${value#\"}"
    elif [[ "$value" =~ ^\'.*\'$ ]]; then
      value="${value%\'}"
      value="${value#\'}"
    fi

    # .env wins over stale shell exports during deploy
    if [[ -n "$key" && -n "$value" ]]; then
      export "$key=$value"
    fi
  done < "$env_file"
}

derive_ec2_host() {
  if [[ -n "${EC2_HOST:-}" ]]; then
    return 0
  fi

  local ssh_user="${EC2_SSH_USER:-ec2-user}"
  local pb_url="${AWS_POCKETBASE_URL:-${VITE_POCKETBASE_URL:-}}"
  if [[ "$pb_url" =~ ^https?://([^:/]+) ]]; then
    EC2_HOST="${ssh_user}@${BASH_REMATCH[1]}"
    warn "EC2_HOST not set — using ${EC2_HOST} from .env"
  fi
}

normalize_public_url() {
  local raw="${1:-}"
  raw="${raw%/}"

  if [[ -z "$raw" ]]; then
    echo "http://$(detect_public_ip)"
    return
  fi

  # http://host:8096 -> http://host
  if [[ "$raw" =~ ^(https?://[^:/]+):[0-9]+$ ]]; then
    echo "${BASH_REMATCH[1]}"
    return
  fi

  echo "$raw"
}

is_deploy_server() {
  [[ "$(uname -s)" == "Linux" ]] || return 1
  [[ -f /etc/os-release ]] || return 1
  return 0
}

ensure_local_deploy_allowed() {
  if is_deploy_server; then
    return 0
  fi

  die "This script targets AWS EC2 (Linux). On macOS/Windows, deploy remotely:

  ./deploy.sh --remote

  Uses ./quithero.pem and ec2-user@54.153.95.239 from .env automatically.
  Or: EC2_HOST=ec2-user@54.153.95.239 ./deploy.sh --remote"
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    die "Docker is not installed. On EC2 run: ./deploy.sh --setup"
  fi

  if ! docker info >/dev/null 2>&1; then
    die "Docker is not running.

  On EC2:  sudo systemctl start docker
  On Mac:  open -a Docker   (or use --remote to deploy to EC2 instead)"
  fi
}

detect_public_ip() {
  curl -fsS --max-time 3 http://checkip.amazonaws.com 2>/dev/null \
    || curl -fsS --max-time 3 https://ifconfig.me 2>/dev/null \
    || hostname -I 2>/dev/null | awk '{print $1}' \
    || echo "127.0.0.1"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

resolve_ssh_key() {
  if [[ -n "${EC2_SSH_KEY:-}" ]]; then
    EC2_SSH_KEY="$(cd "$(dirname "$EC2_SSH_KEY")" && pwd)/$(basename "$EC2_SSH_KEY")"
  elif [[ -f "$SCRIPT_DIR/quithero.pem" ]]; then
    EC2_SSH_KEY="$SCRIPT_DIR/quithero.pem"
  else
    EC2_SSH_KEY=""
    return 0
  fi

  [[ -f "$EC2_SSH_KEY" ]] || die "SSH key not found: $EC2_SSH_KEY"

  local perms
  perms="$(stat -f "%Lp" "$EC2_SSH_KEY" 2>/dev/null || stat -c "%a" "$EC2_SSH_KEY")"
  if [[ "$perms" != "400" && "$perms" != "600" ]]; then
    warn "Fixing SSH key permissions on $EC2_SSH_KEY (chmod 400)"
    chmod 400 "$EC2_SSH_KEY"
  fi
}

ssh_cmd() {
  if [[ -n "${EC2_SSH_KEY:-}" ]]; then
    ssh -i "$EC2_SSH_KEY" -o StrictHostKeyChecking=accept-new "$@"
  else
    ssh -o StrictHostKeyChecking=accept-new "$@"
  fi
}

scp_cmd() {
  if [[ -n "${EC2_SSH_KEY:-}" ]]; then
    scp -i "$EC2_SSH_KEY" -o StrictHostKeyChecking=accept-new "$@"
  else
    scp -o StrictHostKeyChecking=accept-new "$@"
  fi
}

rsync_cmd() {
  local ssh_args=(-o StrictHostKeyChecking=accept-new)
  if [[ -n "${EC2_SSH_KEY:-}" ]]; then
    ssh_args=(-i "$EC2_SSH_KEY" -o StrictHostKeyChecking=accept-new)
  fi
  rsync -e "ssh ${ssh_args[*]}" "$@"
}

run_remote_deploy() {
  load_env_file "$SCRIPT_DIR/.env"
  derive_ec2_host
  resolve_ssh_key
  [[ -n "${EC2_HOST:-}" ]] || die "Set EC2_HOST (e.g. EC2_HOST=ubuntu@54.153.95.239) for --remote"

  require_command rsync
  require_command ssh

  local remote_dir="${REMOTE_APP_DIR:-$APP_DIR}"
  log "Syncing project to ${EC2_HOST}:${remote_dir}"
  [[ -n "${EC2_SSH_KEY:-}" ]] && log "Using SSH key: ${EC2_SSH_KEY}"

  ssh_cmd "$EC2_HOST" "sudo mkdir -p '$remote_dir' && sudo chown -R \$(whoami):\$(whoami) '$remote_dir'"

  rsync_cmd -az --delete \
    --exclude node_modules \
    --exclude backoffice/node_modules \
    --exclude dist \
    --exclude backoffice/dist \
    --exclude PocketBase/pb_data \
    --exclude .git \
    --exclude .env \
    --exclude '*.pem' \
    --exclude '*.log' \
    --exclude .netlify \
    --exclude .vercel \
    --exclude scratch \
    "$SCRIPT_DIR/" "${EC2_HOST}:${remote_dir}/"

  if [[ -f "$SCRIPT_DIR/.env" ]]; then
    scp_cmd "$SCRIPT_DIR/.env" "${EC2_HOST}:${remote_dir}/.env"
  else
    warn "No local .env found — make sure ${remote_dir}/.env exists on the server"
  fi

  log "Running deploy on remote server"
  ssh_cmd "$EC2_HOST" "cd '$remote_dir' && chmod +x deploy.sh && APP_DIR='$remote_dir' ./deploy.sh"
}

install_server_dependencies() {
  log "Installing system dependencies (Docker, Node.js 20, nginx)"

  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    source /etc/os-release
  else
    die "Cannot detect OS — run this on Ubuntu/Debian EC2"
  fi

  case "${ID:-}" in
    ubuntu|debian)
      sudo apt-get update -y
      sudo apt-get install -y ca-certificates curl git nginx rsync

      if ! command -v docker >/dev/null 2>&1; then
        curl -fsSL https://get.docker.com | sudo sh
        sudo usermod -aG docker "$USER" || true
        warn "Added $USER to docker group — log out/in if docker permission errors appear"
      fi

      if ! docker compose version >/dev/null 2>&1; then
        sudo apt-get install -y docker-compose-plugin || true
      fi

      if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
      fi
      ;;
    amzn|amazon)
      sudo yum update -y
      sudo yum install -y git nginx rsync
      if ! command -v docker >/dev/null 2>&1; then
        sudo yum install -y docker
        sudo systemctl enable --now docker
        sudo usermod -aG docker "$USER" || true
      fi
      if ! command -v node >/dev/null 2>&1; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
      fi
      ;;
    *)
      die "Unsupported OS: ${ID:-unknown}. Use Ubuntu 22.04+ on EC2."
      ;;
  esac

  sudo systemctl enable nginx
  sudo systemctl enable docker 2>/dev/null || true
}

open_firewall_ports() {
  if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q "Status: active"; then
    sudo ufw allow "$FRONTEND_PORT/tcp" || true
    sudo ufw allow "$BACKOFFICE_PORT/tcp" || true
    sudo ufw allow "$PB_PORT/tcp" || true
    sudo ufw allow OpenSSH || true
  fi
}

pb_data_dir() {
  if is_deploy_server; then
    echo "${PB_DATA_DIR:-/var/lib/quithero/pb_data}"
  else
    echo "${PB_DATA_DIR:-$APP_DIR/PocketBase/pb_data}"
  fi
}

pb_db_size() {
  local db_file="$1/data.db"
  [[ -f "$db_file" ]] || { echo 0; return; }
  stat -c%s "$db_file" 2>/dev/null || stat -f%z "$db_file" 2>/dev/null || echo 0
}

prepare_pb_data_dir() {
  export PB_DATA_DIR="$(pb_data_dir)"
  log "PocketBase data directory: $PB_DATA_DIR"

  if [[ ! -d "$PB_DATA_DIR" ]]; then
    sudo mkdir -p "$PB_DATA_DIR"
  fi

  # Migrate legacy project-local data if a real database exists there
  for legacy in "$APP_DIR/PocketBase/pb_data" "/home/ec2-user/QUITHERO/PocketBase/pb_data"; do
    if [[ -f "$legacy/data.db" ]] && [[ "$(pb_db_size "$legacy")" -gt 50000 ]]; then
      warn "Migrating PocketBase data from legacy path: $legacy"
      sudo cp -a "$legacy/." "$PB_DATA_DIR/"
      break
    fi
  done
}

backup_pb_data() {
  local size
  size="$(pb_db_size "$PB_DATA_DIR")"
  [[ "$size" -gt 0 ]] || return 0

  local backup_root="${PB_BACKUP_DIR:-/var/lib/quithero/backups}"
  local stamp
  stamp="$(date +%Y%m%d_%H%M%S)"
  sudo mkdir -p "$backup_root"
  sudo cp -a "$PB_DATA_DIR" "$backup_root/pb_data_${stamp}"
  log "Backed up PocketBase data ($size bytes) to $backup_root/pb_data_${stamp}"
}

migrate_ephemeral_container_data() {
  if ! docker ps --format '{{.Names}}' | grep -qx 'quit-hero-pb'; then
    return 0
  fi

  log "Checking for PocketBase data stored in container (pre-fix ephemeral storage)"
  docker exec quit-hero-pb sh -c '
    if [ -f /usr/local/bin/pb_data/data.db ] && [ ! -f /pb/pb_data/data.db ]; then
      mkdir -p /pb/pb_data
      cp -a /usr/local/bin/pb_data/. /pb/pb_data/
      echo "migrated"
    fi
  ' 2>/dev/null || true
}

deploy_pocketbase() {
  log "Starting PocketBase (Docker on port ${PB_PORT})"
  require_docker

  cd "$APP_DIR"

  if [[ ! -f docker-compose.yml ]]; then
    die "docker-compose.yml not found in $APP_DIR"
  fi

  prepare_pb_data_dir
  migrate_ephemeral_container_data
  backup_pb_data

  export PB_ENCRYPTION_KEY="${PB_ENCRYPTION_KEY:-01234567890123456789012345678901}"

  if docker compose version >/dev/null 2>&1; then
    docker compose pull pocketbase || true
    docker compose up -d pocketbase
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose pull pocketbase || true
    docker-compose up -d pocketbase
  else
    die "Neither 'docker compose' nor 'docker-compose' is available"
  fi

  log "Waiting for PocketBase health check"
  local attempts=0
  until curl -fsS "http://127.0.0.1:${PB_PORT}/api/health" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    [[ $attempts -le 30 ]] || die "PocketBase did not become healthy on port ${PB_PORT}"
    sleep 2
  done

  log "PocketBase is healthy (data persisted at $PB_DATA_DIR)"
}

run_pb_setup() {
  [[ "$SKIP_PB_SETUP" == "1" ]] && { warn "Skipping PocketBase setup (SKIP_PB_SETUP=1)"; return; }

  if [[ "$(pb_db_size "$PB_DATA_DIR")" -gt 50000 ]]; then
    warn "Existing PocketBase database detected — skipping complete-setup to protect data"
    return
  fi

  log "Running PocketBase setup scripts (fresh database)"
  cd "$APP_DIR"
  require_command node

  npm install --omit=dev pocketbase 2>/dev/null || npm install pocketbase

  if [[ -f PocketBase/complete-setup.js ]]; then
    node PocketBase/complete-setup.js || warn "complete-setup.js failed — DB may already be initialized"
  elif [[ -f PocketBase/setup-pocketbase.js ]]; then
    node PocketBase/setup-pocketbase.js || warn "setup-pocketbase.js failed — DB may already be initialized"
  fi
}

run_oauth_setup() {
  local google_id="${VITE_GOOGLE_CLIENT_ID:-${GOOGLE_CLIENT_ID:-}}"
  local google_secret="${GOOGLE_CLIENT_SECRET:-}"

  [[ -n "$google_id" && -n "$google_secret" ]] || return

  if [[ ! -f "$APP_DIR/PocketBase/configure-oauth.js" ]]; then
    return
  fi

  log "Configuring Google OAuth on PocketBase"
  cd "$APP_DIR"
  node PocketBase/configure-oauth.js || warn "configure-oauth.js failed — check Google credentials"
}

build_frontend() {
  log "Building frontend"
  cd "$APP_DIR"
  npm ci
  npm run build
}

build_backoffice() {
  log "Building backoffice"
  cd "$APP_DIR/backoffice"
  npm ci
  npm run build
}

setup_ai_proxy() {
  require_command node
  local node_bin service_file
  node_bin="$(command -v node)"

  if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
    warn "ANTHROPIC_API_KEY not set — AI proxy will return 503 until .env is updated"
  fi

  log "Configuring AI proxy (systemd + port ${AI_PROXY_PORT})"

  service_file="/etc/systemd/system/quithero-ai-proxy.service"
  sudo tee "$service_file" >/dev/null <<EOF
[Unit]
Description=Quit Hero AI personalization proxy
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=AI_PROXY_PORT=${AI_PROXY_PORT}
EnvironmentFile=-${APP_DIR}/.env
ExecStart=${node_bin} ${APP_DIR}/scripts/ai-proxy-server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable quithero-ai-proxy.service
  sudo systemctl restart quithero-ai-proxy.service

  # ponytail: single health probe — fails deploy if proxy won't start
  sleep 1
  if ! sudo systemctl is-active --quiet quithero-ai-proxy.service; then
    sudo journalctl -u quithero-ai-proxy.service -n 20 --no-pager || true
    die "quithero-ai-proxy failed to start"
  fi

  log "AI proxy running at 127.0.0.1:${AI_PROXY_PORT}"
}

write_nginx_config() {
  log "Configuring nginx"

  local public_url="${PUBLIC_URL:-http://$(detect_public_ip)}"
  local web_root="$APP_DIR/dist"
  local admin_root="$APP_DIR/backoffice/dist"

  [[ -d "$web_root" ]] || die "Frontend build not found at $web_root"
  [[ -d "$admin_root" ]] || die "Backoffice build not found at $admin_root"

  local nginx_conf
  local tmp_conf
  tmp_conf="$(mktemp)"

  local frontend_listen="listen ${FRONTEND_PORT};"
  local frontend_listen_v6="listen [::]:${FRONTEND_PORT};"
  if [[ "$FRONTEND_PORT" == "80" ]]; then
    frontend_listen="listen ${FRONTEND_PORT} default_server;"
    frontend_listen_v6="listen [::]:${FRONTEND_PORT} default_server;"
  fi

  cat >"$tmp_conf" <<EOF
# Generated by deploy.sh — $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# User app
server {
    ${frontend_listen}
    ${frontend_listen_v6}
    server_name _;

    root ${web_root};
    index index.html;

    # Google OAuth return — static page exchanges code without SSE/realtime
    location = /api/pocketbase/api/oauth2-redirect {
        try_files /oauth-callback.html =404;
    }

    # PocketBase API proxy (matches Vite production /api/pocketbase)
    location /api/pocketbase/ {
        proxy_pass http://127.0.0.1:${PB_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
    }

    # AI personalization proxy (Node — same handler as Netlify function)
    location = /api/ai/personalize {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/ai/personalize;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

# Admin dashboard
server {
    listen ${BACKOFFICE_PORT};
    listen [::]:${BACKOFFICE_PORT};
    server_name _;

    root ${admin_root};
    index index.html;

    location /api/pocketbase/ {
        proxy_pass http://127.0.0.1:${PB_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

  if [[ -d /etc/nginx/sites-available ]]; then
    nginx_conf="/etc/nginx/sites-available/${NGINX_SITE_NAME}"
    sudo cp "$tmp_conf" "$nginx_conf"
    sudo mkdir -p /etc/nginx/sites-enabled
    sudo ln -sfn "$nginx_conf" "/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
    sudo rm -f /etc/nginx/sites-enabled/default
  else
    nginx_conf="/etc/nginx/conf.d/${NGINX_SITE_NAME}.conf"
    sudo cp "$tmp_conf" "$nginx_conf"
    # Stale configs from manual setup can steal port 80 as the default server.
    if [[ -f /etc/nginx/conf.d/pocketbase.conf ]]; then
      sudo mv /etc/nginx/conf.d/pocketbase.conf /etc/nginx/conf.d/pocketbase.conf.disabled
      warn "Disabled stale /etc/nginx/conf.d/pocketbase.conf"
    fi
    if grep -q 'root         /usr/share/nginx/html;' /etc/nginx/nginx.conf 2>/dev/null; then
      sudo sed -i '/server {/,/^    }/{
        /listen       80;/s/^/#disabled-by-deploy /
        /listen       \[::\]:80;/s/^/#disabled-by-deploy /
        /server_name  _;/s/^/#disabled-by-deploy /
        /root         \/usr\/share\/nginx\/html;/s/^/#disabled-by-deploy /
      }' /etc/nginx/nginx.conf
      warn "Disabled built-in nginx default server block in nginx.conf"
    fi
  fi
  rm -f "$tmp_conf"

  sudo nginx -t
  sudo systemctl reload nginx

  log "nginx configured"
  echo ""
  echo "  Frontend:   ${public_url%/}:${FRONTEND_PORT}"
  echo "  Backoffice: ${public_url%/}:${BACKOFFICE_PORT}"
  echo "  PocketBase: ${public_url%/}:${PB_PORT}"
  echo "  PB Admin:   ${public_url%/}:${PB_PORT}/_/"
  echo "  AI Proxy:   ${public_url%/}/api/ai/personalize → 127.0.0.1:${AI_PROXY_PORT}"
  echo ""
}

sync_project_on_server() {
  if [[ -d "$APP_DIR/.git" ]]; then
    log "Updating code in $APP_DIR (branch: $GIT_BRANCH)"
    cd "$APP_DIR"
    git fetch origin
    git checkout "$GIT_BRANCH"
    git pull origin "$GIT_BRANCH"
  elif [[ "$SCRIPT_DIR" != "$APP_DIR" ]]; then
    die "APP_DIR=$APP_DIR is not a git repo. Clone the project there or use --remote from your machine."
  fi
}

deploy_all() {
  ensure_local_deploy_allowed
  load_env_file "$SCRIPT_DIR/.env"

  PUBLIC_URL="$(normalize_public_url "${PUBLIC_URL:-${AWS_POCKETBASE_URL:-${VITE_POCKETBASE_URL:-}}}")"

  if [[ "$SCRIPT_DIR" != "$APP_DIR" && -d "$APP_DIR" ]]; then
    cd "$APP_DIR"
  else
    APP_DIR="$SCRIPT_DIR"
    cd "$APP_DIR"
  fi

  log "Deploying Quit Hero to $APP_DIR"
  log "Public URL base: $PUBLIC_URL"

  sync_project_on_server
  deploy_pocketbase
  run_pb_setup
  run_oauth_setup
  build_frontend
  build_backoffice
  setup_ai_proxy
  write_nginx_config
  open_firewall_ports

  log "Deployment complete"
}

usage() {
  cat <<'USAGE'
Quit Hero EC2 deploy

Commands:
  ./deploy.sh              Deploy on this machine (EC2)
  ./deploy.sh --setup        Install Docker, Node 20, nginx, then deploy
  ./deploy.sh --remote       Rsync + SSH deploy to EC2_HOST
  ./deploy.sh --pb-only      Restart PocketBase only
  ./deploy.sh --help         Show this help

Examples:
  # On EC2 after cloning:
  git clone <repo-url> /opt/quithero
  cd /opt/quithero
  nano .env               # set AWS_PB_* and VITE_POCKETBASE_URL
  ./deploy.sh --setup

  # From laptop (uses ./quithero.pem automatically if present):
  ./deploy.sh --remote
  EC2_HOST=ubuntu@54.153.95.239 ./deploy.sh --remote

Environment:
  APP_DIR, EC2_HOST, EC2_SSH_KEY, GIT_BRANCH, PB_PORT, FRONTEND_PORT, BACKOFFICE_PORT, AI_PROXY_PORT
  PUBLIC_URL, SKIP_PB_SETUP, PB_DATA_DIR, PB_BACKUP_DIR, PB_ENCRYPTION_KEY
USAGE
}

main() {
  local mode="deploy"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --setup)    mode="setup"; shift ;;
      --remote)   mode="remote"; shift ;;
      --pb-only)  mode="pb-only"; shift ;;
      --help|-h)  usage; exit 0 ;;
      *) die "Unknown option: $1 (try --help)" ;;
    esac
  done

  case "$mode" in
    remote)
      run_remote_deploy
      ;;
    setup)
      install_server_dependencies
      deploy_all
      ;;
    pb-only)
      ensure_local_deploy_allowed
      load_env_file "$SCRIPT_DIR/.env"
      APP_DIR="${APP_DIR:-$SCRIPT_DIR}"
      cd "$APP_DIR"
      deploy_pocketbase
      ;;
    deploy)
      deploy_all
      ;;
  esac
}

main "$@"
