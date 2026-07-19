#!/usr/bin/env bash
#
# Smono — AWS EC2 deployment script
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
#   PUBLIC_URL       Public app URL for OAuth/builds (default: http://<server-ip>)
#   DOMAIN_ROOT      Marketing domain root (e.g. smono.app) — enables landing + app/admin subdomains
#   LANDING_HOSTS    Space-separated landing hosts (default: DOMAIN_ROOT www.DOMAIN_ROOT)
#   LANDING_CANONICAL_HOST Preferred landing host for redirects (default: www.DOMAIN_ROOT)
#   APP_HOST         User app host (default: app.DOMAIN_ROOT)
#   ADMIN_HOST       Backoffice host (default: admin.DOMAIN_ROOT)
#   SKIP_PB_SETUP    Set to 1 to skip PocketBase schema setup scripts
#   PB_DATA_DIR      Persistent DB path on server (default: /var/lib/quithero/pb_data)
#   PB_BACKUP_DIR    Backup location (default: /var/lib/quithero/backups)
#   PB_ENCRYPTION_KEY 32-char key for PocketBase Docker (see docker-compose.yml)
#   SUPPORT_CHAT_KEY  64-char hex AES key for support chat (server-only; see .env.example)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-/opt/quithero}"
GIT_BRANCH="${GIT_BRANCH:-main}"
PB_PORT="${PB_PORT:-8096}"
FRONTEND_PORT="${FRONTEND_PORT:-80}"
BACKOFFICE_PORT="${BACKOFFICE_PORT:-8080}"
AI_PROXY_PORT="${AI_PROXY_PORT:-8787}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-quithero}"
PB_CONTAINER_NAME="${PB_CONTAINER_NAME:-smono-pb}"
AI_PROXY_SERVICE="${AI_PROXY_SERVICE:-smono-ai-proxy}"
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

derive_domain_hosts() {
  [[ -n "${DOMAIN_ROOT:-}" ]] || return 0

  LANDING_HOSTS="${LANDING_HOSTS:-${DOMAIN_ROOT} www.${DOMAIN_ROOT}}"
  LANDING_CANONICAL_HOST="${LANDING_CANONICAL_HOST:-www.${DOMAIN_ROOT}}"
  APP_HOST="${APP_HOST:-app.${DOMAIN_ROOT}}"
  ADMIN_HOST="${ADMIN_HOST:-admin.${DOMAIN_ROOT}}"

  if [[ -z "${PUBLIC_URL:-}" || "${PUBLIC_URL}" =~ ^https?://[0-9.]+ ]]; then
    PUBLIC_URL="https://${APP_HOST}"
  fi
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

      if ! command -v certbot >/dev/null 2>&1; then
        sudo apt-get install -y certbot python3-certbot-nginx || warn "certbot install failed — HTTPS setup may need manual certbot"
      fi

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
      if ! command -v certbot >/dev/null 2>&1; then
        sudo yum install -y certbot python3-certbot-nginx || warn "certbot install failed — HTTPS setup may need manual certbot"
      fi
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
    if [[ -n "${DOMAIN_ROOT:-}" ]]; then
      sudo ufw allow 443/tcp || true
    fi
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
  # Legacy container name from pre-smono rename
  local container=""
  if docker ps --format '{{.Names}}' | grep -qx "$PB_CONTAINER_NAME"; then
    container="$PB_CONTAINER_NAME"
  elif docker ps --format '{{.Names}}' | grep -qx 'quit-hero-pb'; then
    container='quit-hero-pb'
  else
    return 0
  fi

  log "Checking for PocketBase data stored in container (pre-fix ephemeral storage)"
  docker exec "$container" sh -c '
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

  # Drop legacy QuitHero container name if the smono container is up
  if docker ps --format '{{.Names}}' | grep -qx "$PB_CONTAINER_NAME"; then
    docker rm -f quit-hero-pb >/dev/null 2>&1 || true
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

run_push_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-push-collections.js" ]] || return

  log "Ensuring push_subscriptions collection exists"
  cd "$APP_DIR"
  node PocketBase/setup-push-collections.js || warn "setup-push-collections.js failed — push may not persist"
}

run_smoke_check_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-smoke-check.js" ]] || return

  log "Ensuring smoke_check collection exists"
  cd "$APP_DIR"
  node PocketBase/setup-smoke-check.js || warn "setup-smoke-check.js failed — smoke check may not work"
}

run_cravings_dates_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-cravings-dates.js" ]] || return

  log "Ensuring cravings created/updated autodate fields"
  cd "$APP_DIR"
  node PocketBase/setup-cravings-dates.js || warn "setup-cravings-dates.js failed — craving history dates may be blank"
}

run_account_deletion_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-account-deletion.js" ]] || return

  log "Ensuring account_deletion_requests collection exists"
  cd "$APP_DIR"
  node PocketBase/setup-account-deletion.js || warn "setup-account-deletion.js failed — deletion requests may not work"
}

run_support_chat_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-support-chat.js" ]] || return

  log "Ensuring support ticket chat collections exist"
  cd "$APP_DIR"
  node PocketBase/setup-support-chat.js || warn "setup-support-chat.js failed — support chat may not work"
}

run_blog_fields_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-blog-fields.js" ]] || return

  log "Ensuring content_items blog fields exist"
  cd "$APP_DIR"
  node PocketBase/setup-blog-fields.js || warn "setup-blog-fields.js failed — landing blog may not work"
}

run_media_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-media.js" ]] || return

  log "Ensuring media collection exists"
  cd "$APP_DIR"
  node PocketBase/setup-media.js || warn "setup-media.js failed — file uploads may not work"
}

run_app_settings_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-app-settings.js" ]] || return

  log "Ensuring app_settings collection exists"
  cd "$APP_DIR"
  node PocketBase/setup-app-settings.js || warn "setup-app-settings.js failed — App Settings may not persist"
}

run_notification_prefs_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-notification-prefs.js" ]] || return

  log "Ensuring user_profiles notification fields exist"
  cd "$APP_DIR"
  node PocketBase/setup-notification-prefs.js || warn "setup-notification-prefs.js failed — profile notification toggles may not save"
}

run_behavior_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-behavior-collections.js" ]] || return

  log "Ensuring behavior / notification_events collections exist"
  cd "$APP_DIR"
  node PocketBase/setup-behavior-collections.js || warn "setup-behavior-collections.js failed — AI notification logs may be empty"
}

run_ai_memory_setup() {
  [[ -f "$APP_DIR/PocketBase/setup-ai-memory.js" ]] || return

  log "Ensuring session_ai_memory collection exists"
  cd "$APP_DIR"
  node PocketBase/setup-ai-memory.js || warn "setup-ai-memory.js failed — session AI continuity may not persist"
}

run_pb_rules() {
  [[ -f "$APP_DIR/PocketBase/set-rules.js" ]] || return

  log "Applying PocketBase collection rules (admin + user access)"
  cd "$APP_DIR"
  node PocketBase/set-rules.js || warn "set-rules.js failed — backoffice may not list all users"
}

run_last_active_setup() {
  [[ -f "$APP_DIR/PocketBase/add-last-active.js" ]] || return

  log "Ensuring users.lastActive field exists"
  cd "$APP_DIR"
  node PocketBase/add-last-active.js || warn "add-last-active.js failed — dashboard active-user counts may be stale"
}

run_fix_last_active() {
  [[ -f "$APP_DIR/PocketBase/fix-last-active.js" ]] || return

  log "Clearing bogus users.lastActive heartbeats"
  cd "$APP_DIR"
  node PocketBase/fix-last-active.js || warn "fix-last-active.js failed — active status may be inflated"
}

run_timezone_setup() {
  [[ -f "$APP_DIR/PocketBase/add-timezone-field.js" ]] || return

  log "Ensuring user_profiles.timezone field exists"
  cd "$APP_DIR"
  node PocketBase/add-timezone-field.js || warn "add-timezone-field.js failed — reminder timezone may be wrong"
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

build_landing() {
  [[ -n "${DOMAIN_ROOT:-}" ]] || return 0
  [[ -f "$APP_DIR/landing/package.json" ]] || return 0

  log "Building landing"
  cd "$APP_DIR/landing"
  npm ci
  # prerender/sitemap need PB for blog <a> links
  POCKETBASE_INTERNAL_URL="http://127.0.0.1:${PB_PORT}" npm run build
  [[ -f "$APP_DIR/landing/dist/index.html" ]] || die "Landing build missing dist/index.html"
}

setup_ai_proxy() {
  require_command node
  local node_bin service_file
  node_bin="$(command -v node)"

  if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
    warn "ANTHROPIC_API_KEY not set — AI proxy will return 503 until .env is updated"
  fi

  log "Configuring API server — AI + push (systemd, port ${AI_PROXY_PORT})"

  service_file="/etc/systemd/system/${AI_PROXY_SERVICE}.service"
  sudo tee "$service_file" >/dev/null <<EOF
[Unit]
Description=Smono API server (AI personalization + Web Push)
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=AI_PROXY_PORT=${AI_PROXY_PORT}
Environment=POCKETBASE_INTERNAL_URL=http://127.0.0.1:${PB_PORT}
EnvironmentFile=-${APP_DIR}/.env
ExecStart=${node_bin} ${APP_DIR}/scripts/api-server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  # Migrate off legacy QuitHero unit name
  sudo systemctl disable --now quithero-ai-proxy.service >/dev/null 2>&1 || true
  sudo rm -f /etc/systemd/system/quithero-ai-proxy.service
  sudo systemctl daemon-reload
  sudo systemctl enable "${AI_PROXY_SERVICE}.service"
  sudo systemctl restart "${AI_PROXY_SERVICE}.service"

  # ponytail: single health probe — fails deploy if proxy won't start
  sleep 1
  if ! sudo systemctl is-active --quiet "${AI_PROXY_SERVICE}.service"; then
    sudo journalctl -u "${AI_PROXY_SERVICE}.service" -n 20 --no-pager || true
    die "${AI_PROXY_SERVICE} failed to start"
  fi

  log "AI proxy running at 127.0.0.1:${AI_PROXY_PORT}"
}

append_nginx_app_api_locations() {
  local root="$1"
  cat >>"$tmp_conf" <<EOF

    # Keep gated app out of search indexes
    add_header X-Robots-Tag "noindex, nofollow" always;

    location = /favicon.ico { try_files /mascot.png =404; }

    # Google OAuth return — static page exchanges code without SSE/realtime
    location = /api/pocketbase/api/oauth2-redirect {
        try_files /oauth-callback.html =404;
    }

    # PocketBase API proxy (matches Vite production /api/pocketbase)
    location /api/pocketbase/ {
        client_max_body_size 100m;
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

    # Web Push API (subscribe / VAPID key)
    location /api/push/ {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/push/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 15s;
        proxy_connect_timeout 5s;
    }

    # Support chat (AES-GCM at rest; key on API server only)
    location /api/support/ {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/support/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 15s;
        proxy_connect_timeout 5s;
    }

    # Razorpay Standard Checkout
    location = /api/create-order {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/create-order;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    location = /api/preview-coupon {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/preview-coupon;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 15s;
        proxy_connect_timeout 5s;
    }

    location = /api/verify-payment {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/verify-payment;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    location = /api/razorpay/webhook {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/razorpay/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Razorpay-Signature \$http_x_razorpay_signature;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    # Store IAP (StoreKit / Play Billing)
    location /api/iap/ {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/iap/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    # Universal Links / App Links
    location ^~ /.well-known/ {
        default_type application/json;
        add_header Content-Type application/json;
        try_files \$uri =404;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
EOF
}

append_nginx_admin_api_locations() {
  cat >>"$tmp_conf" <<EOF

    location = /favicon.ico { try_files /mascot.png =404; }

    location /api/pocketbase/ {
        client_max_body_size 100m;
        proxy_pass http://127.0.0.1:${PB_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
    }

    # Web Push notify (admin win-back / re-engagement)
    location /api/push/ {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/push/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 15s;
        proxy_connect_timeout 5s;
    }

    # Support chat reply / decrypt (admin)
    location /api/support/ {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/support/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 15s;
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
EOF
}

nginx_config_path() {
  local p="/etc/nginx/conf.d/${NGINX_SITE_NAME}.conf"
  if [[ -f "$p" ]]; then
    echo "$p"
    return
  fi
  p="/etc/nginx/sites-enabled/${NGINX_SITE_NAME}"
  echo "$p"
}

nginx_config_has_ssl_listener() {
  local conf
  conf="$(nginx_config_path)"
  sudo grep -qE 'listen[[:space:]]+443[[:space:]]+ssl' "$conf" 2>/dev/null
}

https_port_listening() {
  sudo ss -tlnp 2>/dev/null | grep -q ':443 '
}

nginx_ssl_certs_available() {
  [[ -n "${DOMAIN_ROOT:-}" ]] \
    && sudo test -f "/etc/letsencrypt/live/${DOMAIN_ROOT}/fullchain.pem" \
    && sudo test -f "/etc/letsencrypt/live/${DOMAIN_ROOT}/privkey.pem" \
    && sudo test -f /etc/letsencrypt/options-ssl-nginx.conf \
    && sudo test -f /etc/letsencrypt/ssl-dhparams.pem
}

ensure_https_configured() {
  [[ -n "${DOMAIN_ROOT:-}" ]] || return 0
  command -v certbot >/dev/null 2>&1 || return 0
  sudo test -f "/etc/letsencrypt/live/${DOMAIN_ROOT}/fullchain.pem" || return 0

  if nginx_config_has_ssl_listener && https_port_listening; then
    return 0
  fi

  log "Ensuring HTTPS (nginx missing 443 or port not listening — certbot --reinstall)"
  local cert_args=(-d "${DOMAIN_ROOT}")
  cert_args+=(-d "www.${DOMAIN_ROOT}")
  cert_args+=(-d "${APP_HOST:-app.${DOMAIN_ROOT}}")
  cert_args+=(-d "${ADMIN_HOST:-admin.${DOMAIN_ROOT}}")

  sudo certbot --nginx "${cert_args[@]}" --non-interactive --redirect --reinstall \
    || die "certbot --reinstall failed — HTTPS will be down until fixed"

  sudo nginx -t
  sudo systemctl reload nginx

  https_port_listening || die "HTTPS not listening on port 443 after certbot — check nginx and security group"
}

append_nginx_server_listen() {
  local default_suffix="${1:-}"
  if nginx_ssl_certs_available; then
    cat >>"$tmp_conf" <<EOF

    listen 443 ssl${default_suffix};
    listen [::]:443 ssl${default_suffix};
    ssl_certificate /etc/letsencrypt/live/${DOMAIN_ROOT}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_ROOT}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
EOF
  else
    cat >>"$tmp_conf" <<EOF

    listen ${FRONTEND_PORT}${default_suffix};
    listen [::]:${FRONTEND_PORT}${default_suffix};
EOF
  fi
}

append_nginx_http_redirect() {
  local hosts="$1"
  local default_suffix="${2:-}"
  nginx_ssl_certs_available || return 0
  cat >>"$tmp_conf" <<EOF

server {
    listen ${FRONTEND_PORT}${default_suffix};
    listen [::]:${FRONTEND_PORT}${default_suffix};
    server_name ${hosts};
    return 301 https://\$host\$request_uri;
}
EOF
}

write_nginx_config() {
  log "Configuring nginx"

  local public_url="${PUBLIC_URL:-http://$(detect_public_ip)}"
  local web_root="$APP_DIR/dist"
  local admin_root="$APP_DIR/backoffice/dist"
  local landing_root="$APP_DIR/landing/dist"
  [[ -d "$landing_root" ]] || landing_root="$APP_DIR/landing"

  [[ -d "$web_root" ]] || die "Frontend build not found at $web_root"
  [[ -d "$admin_root" ]] || die "Backoffice build not found at $admin_root"

  local nginx_conf
  local tmp_conf
  tmp_conf="$(mktemp)"

  if [[ -n "${DOMAIN_ROOT:-}" ]]; then
    [[ -f "$landing_root/index.html" ]] || die "Landing page not found at $landing_root/index.html (set DOMAIN_ROOT only when landing/ exists)"

    cat >"$tmp_conf" <<EOF
# Generated by deploy.sh — $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Marketing landing — ${LANDING_HOSTS}
server {
    server_name ${LANDING_HOSTS};

    # Consolidate www + apex to one host for crawl consistency.
    if (\$host != ${LANDING_CANONICAL_HOST}) {
        return 301 https://${LANDING_CANONICAL_HOST}\$request_uri;
    }

    root ${landing_root};
    index index.html;

    location = /favicon.ico { try_files /mascot.png =404; }

    location /api/pocketbase/ {
        client_max_body_size 100m;
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
    }

    # Razorpay guest checkout from marketing site
    location = /api/create-order {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/create-order;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    location = /api/preview-coupon {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/preview-coupon;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 15s;
        proxy_connect_timeout 5s;
    }

    location = /api/verify-payment {
        proxy_pass http://127.0.0.1:${AI_PROXY_PORT}/api/verify-payment;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
EOF
    append_nginx_server_listen " default_server"
    echo "}" >>"$tmp_conf"
    append_nginx_http_redirect "${LANDING_HOSTS}" " default_server"

    cat >>"$tmp_conf" <<EOF

# User app — ${APP_HOST}
server {
    server_name ${APP_HOST};

    root ${web_root};
    index index.html;
EOF
    append_nginx_app_api_locations "$web_root"
    append_nginx_server_listen ""
    echo "}" >>"$tmp_conf"
    append_nginx_http_redirect "${APP_HOST}"

    cat >>"$tmp_conf" <<EOF

# Admin dashboard — ${ADMIN_HOST}
server {
    server_name ${ADMIN_HOST};

    root ${admin_root};
    index index.html;
EOF
    append_nginx_admin_api_locations
    append_nginx_server_listen ""
    echo "}" >>"$tmp_conf"
    append_nginx_http_redirect "${ADMIN_HOST}"

    cat >>"$tmp_conf" <<EOF

# Admin dashboard (direct IP / legacy port access)
server {
    listen ${BACKOFFICE_PORT};
    listen [::]:${BACKOFFICE_PORT};
    server_name _;

    root ${admin_root};
    index index.html;
EOF
    append_nginx_admin_api_locations

    echo "}" >>"$tmp_conf"
  else
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
EOF
    append_nginx_app_api_locations "$web_root"

    cat >>"$tmp_conf" <<EOF
}

# Admin dashboard
server {
    listen ${BACKOFFICE_PORT};
    listen [::]:${BACKOFFICE_PORT};
    server_name _;

    root ${admin_root};
    index index.html;
EOF
    append_nginx_admin_api_locations

    echo "}" >>"$tmp_conf"
  fi

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

  ensure_https_configured

  if [[ -n "${DOMAIN_ROOT:-}" ]] && nginx_ssl_certs_available; then
    https_port_listening || die "HTTPS not listening on port 443 — deploy aborted to avoid silent outage"
  fi

  log "nginx configured"
  echo ""
  if [[ -n "${DOMAIN_ROOT:-}" ]]; then
    echo "  Landing:    https://${LANDING_CANONICAL_HOST:-$DOMAIN_ROOT}"
    echo "  App:        https://${APP_HOST}"
    echo "  Admin:      https://${ADMIN_HOST}"
    echo "  Backoffice: ${public_url%/}:${BACKOFFICE_PORT}  (legacy IP access)"
  else
    echo "  Frontend:   ${public_url%/}:${FRONTEND_PORT}"
    echo "  Backoffice: ${public_url%/}:${BACKOFFICE_PORT}"
  fi
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

  derive_domain_hosts
  PUBLIC_URL="$(normalize_public_url "${PUBLIC_URL:-${AWS_POCKETBASE_URL:-${VITE_POCKETBASE_URL:-}}}")"

  if [[ "$SCRIPT_DIR" != "$APP_DIR" && -d "$APP_DIR" ]]; then
    cd "$APP_DIR"
  else
    APP_DIR="$SCRIPT_DIR"
    cd "$APP_DIR"
  fi

  log "Deploying Smono to $APP_DIR"
  log "Public URL base: $PUBLIC_URL"

  sync_project_on_server
  deploy_pocketbase
  run_pb_setup
  run_push_setup
  run_smoke_check_setup
  run_cravings_dates_setup
  run_account_deletion_setup
  run_support_chat_setup
  run_blog_fields_setup
  run_media_setup
  run_app_settings_setup
  run_notification_prefs_setup
  run_behavior_setup
  run_ai_memory_setup
  run_pb_rules
  run_last_active_setup
  run_fix_last_active
  run_timezone_setup
  run_oauth_setup
  build_frontend
  build_backoffice
  build_landing
  setup_ai_proxy
  write_nginx_config
  open_firewall_ports

  log "Deployment complete"
}

usage() {
  cat <<'USAGE'
Smono EC2 deploy

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
  PUBLIC_URL, DOMAIN_ROOT, LANDING_HOSTS, LANDING_CANONICAL_HOST, APP_HOST, ADMIN_HOST
  SKIP_PB_SETUP, PB_DATA_DIR, PB_BACKUP_DIR, PB_ENCRYPTION_KEY
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
