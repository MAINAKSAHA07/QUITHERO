#!/bin/bash

# Setup Cloudflare Tunnel for PocketBase HTTPS (No domain needed!)
# This provides free HTTPS without needing a domain name

set -e

echo "=========================================="
echo "Cloudflare Tunnel Setup for PocketBase"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Step 1: Download Cloudflare Tunnel
echo -e "${YELLOW}Step 1: Downloading Cloudflare Tunnel...${NC}"
cd /tmp
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
cloudflared --version
echo -e "${GREEN}Cloudflare Tunnel installed${NC}"

# Step 2: Authenticate
echo -e "${YELLOW}Step 2: Authentication${NC}"
echo -e "${YELLOW}This will open a browser window for authentication.${NC}"
echo -e "${YELLOW}If you're SSH'd in, you'll get a URL to visit.${NC}"
read -p "Press Enter to continue..."
cloudflared tunnel login

# Step 3: Create Tunnel
echo -e "${YELLOW}Step 3: Creating Tunnel...${NC}"
TUNNEL_NAME="quithero-pb-$(date +%s)"
cloudflared tunnel create $TUNNEL_NAME
echo -e "${GREEN}Tunnel created: $TUNNEL_NAME${NC}"

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo -e "${GREEN}Tunnel ID: $TUNNEL_ID${NC}"

# Step 4: Create Config
echo -e "${YELLOW}Step 4: Creating Tunnel Configuration...${NC}"
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $TUNNEL_NAME.trycloudflare.com
    service: http://localhost:8096
  - service: http_status:404
EOF

echo -e "${GREEN}Configuration created${NC}"

# Step 5: Run Tunnel
echo -e "${YELLOW}Step 5: Starting Tunnel...${NC}"
echo -e "${GREEN}Your PocketBase will be available at: https://$TUNNEL_NAME.trycloudflare.com${NC}"
echo -e "${YELLOW}Note: This is a temporary URL. For permanent URL, you need to set up a custom domain.${NC}"
echo ""
echo -e "${YELLOW}To run the tunnel in the background, use:${NC}"
echo "sudo cloudflared tunnel --config ~/.cloudflared/config.yml run $TUNNEL_ID"
echo ""
echo -e "${YELLOW}To run as a service, create a systemd service file.${NC}"

# Step 6: Create systemd service
echo -e "${YELLOW}Step 6: Creating systemd service...${NC}"
cat > /etc/systemd/system/cloudflared.service << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --config /root/.cloudflared/config.yml run $TUNNEL_ID
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cloudflared
systemctl start cloudflared

echo -e "${GREEN}Cloudflare Tunnel service created and started${NC}"

# Get the URL
echo ""
echo -e "${GREEN}=========================================="
echo "✅ Cloudflare Tunnel Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Your PocketBase HTTPS URL:"
echo -e "${GREEN}https://$TUNNEL_NAME.trycloudflare.com${NC}"
echo ""
echo "Next steps:"
echo "1. Update environment variables:"
echo "   VITE_POCKETBASE_URL=https://$TUNNEL_NAME.trycloudflare.com"
echo "2. Redeploy your frontend and backoffice"
echo "3. Test the URL in your browser"
echo ""
echo "To check tunnel status:"
echo "  sudo systemctl status cloudflared"
echo "To view logs:"
echo "  sudo journalctl -u cloudflared -f"
echo ""
