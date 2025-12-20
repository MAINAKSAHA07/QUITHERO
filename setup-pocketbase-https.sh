#!/bin/bash

# Setup HTTPS for PocketBase on AWS EC2 using Nginx and Let's Encrypt
# This script sets up a reverse proxy with SSL certificate

set -e

echo "=========================================="
echo "PocketBase HTTPS Setup"
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

# Step 1: Install Nginx
echo -e "${YELLOW}Step 1: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    yum update -y
    yum install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}Nginx installed${NC}"
else
    echo -e "${GREEN}Nginx already installed${NC}"
fi

# Step 2: Install Certbot
echo -e "${YELLOW}Step 2: Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    yum install -y certbot python3-certbot-nginx
    echo -e "${GREEN}Certbot installed${NC}"
else
    echo -e "${GREEN}Certbot already installed${NC}"
fi

# Step 3: Get domain name
echo -e "${YELLOW}Step 3: Domain Configuration${NC}"
read -p "Enter your domain name (e.g., pb.quithero.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}Domain name is required!${NC}"
    exit 1
fi

# Step 4: Configure Nginx
echo -e "${YELLOW}Step 4: Configuring Nginx...${NC}"
cat > /etc/nginx/conf.d/pocketbase.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    location / {
        proxy_pass http://localhost:8096;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

echo -e "${GREEN}Nginx configured${NC}"

# Step 5: Get SSL Certificate
echo -e "${YELLOW}Step 5: Obtaining SSL Certificate...${NC}"
echo -e "${YELLOW}Make sure your domain ${DOMAIN_NAME} points to this server's IP!${NC}"
read -p "Press Enter when DNS is configured..."

certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos --email mainaksaha0807@gmail.com

# Step 6: Set up auto-renewal
echo -e "${YELLOW}Step 6: Setting up certificate auto-renewal...${NC}"
systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer

echo ""
echo -e "${GREEN}=========================================="
echo "✅ HTTPS Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Your PocketBase is now accessible at:"
echo -e "${GREEN}https://${DOMAIN_NAME}${NC}"
echo ""
echo "Next steps:"
echo "1. Update environment variables:"
echo "   VITE_POCKETBASE_URL=https://${DOMAIN_NAME}"
echo "2. Redeploy your frontend and backoffice"
echo "3. Update PocketBase CORS settings to allow your domains"
echo ""
