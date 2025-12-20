#!/bin/bash

# PocketBase Setup Script for AWS EC2 (Amazon Linux 2023)
# This script installs Docker, Docker Compose, and sets up PocketBase

set -e  # Exit on error

echo "=========================================="
echo "PocketBase Setup for AWS EC2"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install Docker
echo -e "${YELLOW}Step 1: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ec2-user
    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${GREEN}Docker is already installed${NC}"
fi

# Step 2: Install Docker Compose
echo -e "${YELLOW}Step 2: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}Docker Compose is already installed${NC}"
fi

# Step 3: Verify installations
echo -e "${YELLOW}Step 3: Verifying installations...${NC}"
docker --version
docker-compose --version

# Step 4: Navigate to project directory
echo -e "${YELLOW}Step 4: Setting up project directory...${NC}"
cd ~/QUITHERO || { echo "Error: QUITHERO directory not found. Please clone the repository first."; exit 1; }

# Step 5: Create .env file if it doesn't exist
echo -e "${YELLOW}Step 5: Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    cat > .env << EOF
# PocketBase Configuration
VITE_POCKETBASE_URL=http://localhost:8096
PB_ENCRYPTION_KEY=$(openssl rand -hex 16)
PB_ADMIN_EMAIL=admin@quithero.com
PB_ADMIN_PASSWORD=$(openssl rand -base64 12)
EOF
    echo -e "${GREEN}.env file created${NC}"
    echo -e "${YELLOW}IMPORTANT: Please update PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in .env file${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

# Step 6: Create necessary directories
echo -e "${YELLOW}Step 6: Creating PocketBase directories...${NC}"
mkdir -p PocketBase/pb_data
mkdir -p PocketBase/pb_migrations
chmod -R 755 PocketBase

# Step 7: Start PocketBase with Docker Compose
echo -e "${YELLOW}Step 7: Starting PocketBase container...${NC}"
source .env
# Try docker without sudo first, fallback to sudo if permission denied
if docker ps &>/dev/null; then
    docker-compose up -d
else
    echo -e "${YELLOW}Using sudo for docker commands (group membership may require logout/login)${NC}"
    sudo docker-compose up -d
fi

# Wait for PocketBase to be ready
echo -e "${YELLOW}Waiting for PocketBase to be ready...${NC}"
sleep 10
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:8096/api/health &> /dev/null; then
        echo -e "${GREEN}PocketBase is ready!${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${YELLOW}Warning: PocketBase may not be fully ready. Please check logs with: docker-compose logs${NC}"
fi

# Step 8: Install Node.js dependencies (needed for setup scripts)
echo -e "${YELLOW}Step 8: Installing Node.js dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

if [ -f package.json ]; then
    npm install
    echo -e "${GREEN}Node.js dependencies installed${NC}"
else
    echo -e "${YELLOW}Warning: package.json not found. Skipping npm install.${NC}"
fi

# Step 9: Run PocketBase setup scripts
echo -e "${YELLOW}Step 9: Setting up PocketBase collections...${NC}"
echo -e "${YELLOW}Note: You'll need to create an admin account first at http://YOUR_EC2_IP:8096/_/${NC}"
echo -e "${YELLOW}Then run: npm run pb:setup${NC}"

# Display summary
echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open http://YOUR_EC2_IP:8096/_/ in your browser"
echo "2. Create an admin account (first time only)"
echo "3. Run: npm run pb:setup (to create collections)"
echo "4. Run: npm run pb:seed-program (to seed initial data)"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop: docker-compose down"
echo "  - Start: docker-compose up -d"
echo "  - Restart: docker-compose restart"
echo ""
echo "IMPORTANT: Update security group to allow inbound traffic on port 8096"
echo "=========================================="
