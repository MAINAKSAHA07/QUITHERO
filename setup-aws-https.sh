#!/bin/bash

# Setup HTTPS for PocketBase on AWS EC2 using Nginx and Let's Encrypt
# This script sets up a reverse proxy with SSL certificate and updates security groups

set -e

echo "=========================================="
echo "PocketBase HTTPS Setup for AWS"
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

# Step 1: Update AWS Security Group
echo -e "${YELLOW}Step 1: AWS Security Group Configuration${NC}"
echo -e "${BLUE}You need to update your AWS Security Group to allow:${NC}"
echo -e "${BLUE}  - Port 80 (HTTP) - for Let's Encrypt verification${NC}"
echo -e "${BLUE}  - Port 443 (HTTPS) - for secure access${NC}"
echo ""
echo -e "${YELLOW}Option A: Update via AWS Console${NC}"
echo "1. Go to EC2 → Security Groups"
echo "2. Find your instance's security group"
echo "3. Add Inbound Rules:"
echo "   - Type: HTTP, Port: 80, Source: 0.0.0.0/0"
echo "   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0"
echo ""
echo -e "${YELLOW}Option B: Update via AWS CLI (if installed)${NC}"

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    echo -e "${GREEN}AWS CLI found${NC}"
    read -p "Do you want to update security group via AWS CLI? (y/n): " USE_CLI
    
    if [ "$USE_CLI" = "y" ] || [ "$USE_CLI" = "Y" ]; then
        # Get instance metadata
        INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
        REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
        SG_ID=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --region $REGION --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)
        
        echo -e "${BLUE}Instance ID: $INSTANCE_ID${NC}"
        echo -e "${BLUE}Security Group: $SG_ID${NC}"
        
        # Add HTTP rule
        echo "Adding HTTP (port 80) rule..."
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 80 \
            --cidr 0.0.0.0/0 \
            --region $REGION 2>/dev/null || echo "HTTP rule may already exist"
        
        # Add HTTPS rule
        echo "Adding HTTPS (port 443) rule..."
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 443 \
            --cidr 0.0.0.0/0 \
            --region $REGION 2>/dev/null || echo "HTTPS rule may already exist"
        
        echo -e "${GREEN}Security group updated${NC}"
    fi
else
    echo -e "${YELLOW}AWS CLI not found. Please update security group manually via AWS Console.${NC}"
fi

read -p "Press Enter when security group is configured (ports 80 and 443 open)..."

# Step 2: Install Nginx
echo -e "${YELLOW}Step 2: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    yum update -y
    yum install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}Nginx installed${NC}"
else
    echo -e "${GREEN}Nginx already installed${NC}"
fi

# Step 3: Install Certbot
echo -e "${YELLOW}Step 3: Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    # Install EPEL repository for certbot
    yum install -y epel-release
    yum install -y certbot python3-certbot-nginx
    echo -e "${GREEN}Certbot installed${NC}"
else
    echo -e "${GREEN}Certbot already installed${NC}"
fi

# Step 4: Get domain name
echo -e "${YELLOW}Step 4: Domain Configuration${NC}"
read -p "Enter your domain name (e.g., pb.quithero.com) or press Enter to use IP: " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    # Use IP address - will need to use self-signed cert or Cloudflare Tunnel
    echo -e "${YELLOW}No domain provided. You have two options:${NC}"
    echo "1. Use Cloudflare Tunnel (free HTTPS without domain) - see CLOUDFLARE-TUNNEL-SETUP.md"
    echo "2. Get a domain and run this script again"
    exit 1
fi

# Step 5: Verify DNS
echo -e "${YELLOW}Step 5: DNS Verification${NC}"
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo -e "${BLUE}Your EC2 public IP: $INSTANCE_IP${NC}"
echo -e "${YELLOW}Make sure $DOMAIN_NAME points to $INSTANCE_IP${NC}"
echo "You can check with: dig $DOMAIN_NAME +short"
read -p "Press Enter when DNS is configured correctly..."

# Step 6: Configure Nginx
echo -e "${YELLOW}Step 6: Configuring Nginx...${NC}"
cat > /etc/nginx/conf.d/pocketbase.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Increase timeouts for PocketBase
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

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
        
        # WebSocket support
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

echo -e "${GREEN}Nginx configured${NC}"

# Step 7: Get SSL Certificate
echo -e "${YELLOW}Step 7: Obtaining SSL Certificate from Let's Encrypt...${NC}"
read -p "Enter your email for Let's Encrypt notifications (default: mainaksaha0807@gmail.com): " EMAIL
EMAIL=${EMAIL:-mainaksaha0807@gmail.com}

certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos --email ${EMAIL} --redirect

# Step 8: Set up auto-renewal
echo -e "${YELLOW}Step 8: Setting up certificate auto-renewal...${NC}"
systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer

# Test renewal
certbot renew --dry-run

echo ""
echo -e "${GREEN}=========================================="
echo "✅ HTTPS Setup Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Your PocketBase is now accessible at:${NC}"
echo -e "${BLUE}https://${DOMAIN_NAME}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update Vercel environment variables:"
echo "   ${BLUE}VITE_POCKETBASE_URL=https://${DOMAIN_NAME}${NC}"
echo "   ${BLUE}VITE_BACKOFFICE_PB_URL=https://${DOMAIN_NAME}${NC}"
echo ""
echo "2. Update PocketBase CORS settings:"
echo "   - Go to PocketBase Admin UI: https://${DOMAIN_NAME}/_/"
echo "   - Settings → API → CORS"
echo "   - Add your frontend domains:"
echo "     * https://quitherobackoffice.vercel.app"
echo "     * https://quithero.netlify.app/"
echo ""
echo "3. Redeploy your frontend and backoffice applications"
echo ""
echo -e "${GREEN}Certificate will auto-renew every 90 days!${NC}"
echo ""

