#!/bin/bash

# Setup Cloudflare Tunnel for PocketBase - Free HTTPS without domain
# This script sets up a Cloudflare Tunnel to provide HTTPS access to PocketBase

set -e

echo "=========================================="
echo "Cloudflare Tunnel Setup for PocketBase"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Step 1: Install Cloudflare Tunnel
echo -e "${YELLOW}Step 1: Installing Cloudflare Tunnel...${NC}"
if ! command -v cloudflared &> /dev/null; then
    cd /tmp
    echo "Downloading cloudflared..."
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared-linux-amd64
    chmod +x cloudflared-linux-amd64
    mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
    echo -e "${GREEN}Cloudflare Tunnel installed${NC}"
else
    echo -e "${GREEN}Cloudflare Tunnel already installed${NC}"
fi

# Step 2: Authenticate
echo -e "${YELLOW}Step 2: Authenticating with Cloudflare...${NC}"
echo -e "${BLUE}This will open a browser or give you a URL to authenticate${NC}"
echo -e "${BLUE}You need a free Cloudflare account${NC}"
read -p "Press Enter to start authentication..."

cloudflared tunnel login

# Step 3: Create Tunnel
echo -e "${YELLOW}Step 3: Creating tunnel...${NC}"
TUNNEL_NAME="quithero-pb"
cloudflared tunnel create $TUNNEL_NAME 2>/dev/null || echo "Tunnel may already exist"

# Step 4: Get Tunnel ID
echo -e "${YELLOW}Step 4: Getting tunnel ID...${NC}"
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}' | head -1)

if [ -z "$TUNNEL_ID" ]; then
    echo -e "${RED}Failed to get tunnel ID. Please check tunnel list:${NC}"
    cloudflared tunnel list
    exit 1
fi

echo -e "${GREEN}Tunnel ID: $TUNNEL_ID${NC}"

# Step 5: Create Config Directory
echo -e "${YELLOW}Step 5: Creating configuration...${NC}"
CONFIG_DIR="/etc/cloudflared"
mkdir -p $CONFIG_DIR

# Step 6: Create Config File
cat > $CONFIG_DIR/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: quithero-pb.trycloudflare.com
    service: http://localhost:8096
  - service: http_status:404
EOF

echo -e "${GREEN}Configuration created at $CONFIG_DIR/config.yml${NC}"

# Step 7: Create Systemd Service
echo -e "${YELLOW}Step 6: Creating systemd service...${NC}"
cat > /etc/systemd/system/cloudflared.service << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --config $CONFIG_DIR/config.yml run $TUNNEL_ID
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# Step 8: Start and Enable Service
echo -e "${YELLOW}Step 7: Starting Cloudflare Tunnel service...${NC}"
systemctl daemon-reload
systemctl enable cloudflared
systemctl start cloudflared

# Wait a moment for tunnel to start
sleep 3

# Step 9: Check Status
echo -e "${YELLOW}Step 8: Checking tunnel status...${NC}"
if systemctl is-active --quiet cloudflared; then
    echo -e "${GREEN}Cloudflare Tunnel is running!${NC}"
else
    echo -e "${RED}Cloudflare Tunnel failed to start. Checking logs...${NC}"
    journalctl -u cloudflared -n 20 --no-pager
    exit 1
fi

# Step 10: Get Tunnel URL
echo ""
echo -e "${GREEN}=========================================="
echo "✅ Cloudflare Tunnel Setup Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Your PocketBase HTTPS URL:${NC}"
echo -e "${BLUE}https://quithero-pb.trycloudflare.com${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the URL:"
echo "   ${BLUE}curl https://quithero-pb.trycloudflare.com/api/health${NC}"
echo ""
echo "2. Update Vercel environment variables:"
echo "   - Go to Vercel → Your Project → Settings → Environment Variables"
echo "   - Add/Update: ${BLUE}VITE_POCKETBASE_URL=https://quithero-pb.trycloudflare.com${NC}"
echo "   - Add/Update: ${BLUE}VITE_BACKOFFICE_PB_URL=https://quithero-pb.trycloudflare.com${NC}"
echo "   - Environment: Production, Preview, Development"
echo ""
echo "3. Update PocketBase CORS:"
echo "   - Access: ${BLUE}https://quithero-pb.trycloudflare.com/_/${NC}"
echo "   - Settings → API → CORS"
echo "   - Add: ${BLUE}https://quitherobackoffice.vercel.app${NC}"
echo "   - Add: ${BLUE}https://quithero.netlify.app${NC}"
echo ""
echo "4. Redeploy your Vercel application"
echo ""
echo -e "${GREEN}Tunnel will start automatically on server reboot!${NC}"
echo ""

# Show logs
echo -e "${YELLOW}Recent tunnel logs:${NC}"
journalctl -u cloudflared -n 10 --no-pager

