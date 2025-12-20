# Fix: Mixed Content Error - HTTPS to HTTP

## The Problem

Your frontend is deployed on HTTPS (`https://quithero.netlify.app`) but trying to connect to PocketBase over HTTP (`http://54.153.95.239:8096`).

**Browsers block HTTP requests from HTTPS pages for security reasons.**

## Solutions

You have 3 options to fix this:

### Option 1: Set Up HTTPS for PocketBase (Recommended)

Set up SSL/TLS certificate for your AWS EC2 instance so PocketBase can be accessed via HTTPS.

#### Quick Setup with Nginx Reverse Proxy + Let's Encrypt

1. **SSH into your EC2 instance**:
   ```bash
   ssh -i quithero.pem ec2-user@54.153.95.239
   ```

2. **Install Nginx and Certbot**:
   ```bash
   sudo yum install -y nginx certbot python3-certbot-nginx
   ```

3. **Configure Nginx** (create `/etc/nginx/conf.d/pocketbase.conf`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # Replace with your domain
       
       location / {
           proxy_pass http://localhost:8096;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Get SSL Certificate**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

5. **Update Environment Variables**:
   - Change `VITE_POCKETBASE_URL` to `https://your-domain.com`
   - Redeploy frontend and backoffice

### Option 2: Use Cloudflare Tunnel (Easiest, No Domain Needed)

Cloudflare Tunnel provides HTTPS without needing a domain or opening ports.

1. **Install Cloudflare Tunnel** on EC2:
   ```bash
   # Download cloudflared
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   chmod +x cloudflared-linux-amd64
   sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
   ```

2. **Authenticate**:
   ```bash
   cloudflared tunnel login
   ```

3. **Create Tunnel**:
   ```bash
   cloudflared tunnel create quithero-pb
   ```

4. **Configure Tunnel** (create `~/.cloudflared/config.yml`):
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /home/ec2-user/.cloudflared/<tunnel-id>.json
   
   ingress:
     - hostname: quithero-pb.your-domain.workers.dev
       service: http://localhost:8096
     - service: http_status:404
   ```

5. **Run Tunnel**:
   ```bash
   cloudflared tunnel run quithero-pb
   ```

6. **Update Environment Variables**:
   - Use the Cloudflare tunnel URL (e.g., `https://quithero-pb.your-domain.workers.dev`)

### Option 3: Use AWS Application Load Balancer with SSL (AWS Native)

1. **Create Application Load Balancer** in AWS Console
2. **Request SSL Certificate** via AWS Certificate Manager
3. **Configure Target Group** pointing to EC2 instance (port 8096)
4. **Update Security Groups** to allow traffic from ALB
5. **Update Environment Variables** to use ALB HTTPS URL

## Quick Temporary Fix (Development Only)

⚠️ **NOT RECOMMENDED FOR PRODUCTION**

If you need a quick fix for testing, you can temporarily:

1. **Deploy frontend to HTTP** (not HTTPS) - but Netlify/Vercel force HTTPS
2. **Use a different hosting** that allows HTTP (not recommended)

## Recommended Approach

**For Production**: Use Option 1 (Nginx + Let's Encrypt) or Option 2 (Cloudflare Tunnel)

**Steps**:
1. Set up HTTPS for PocketBase (choose one of the options above)
2. Update environment variable `VITE_POCKETBASE_URL` to use HTTPS URL
3. Redeploy frontend and backoffice
4. Test - Mixed Content error should be resolved

## Current Configuration

Your current setup:
- Frontend: `https://quithero.netlify.app` (HTTPS ✅)
- PocketBase: `http://54.153.95.239:8096` (HTTP ❌)

**Needs to be**:
- Frontend: `https://quithero.netlify.app` (HTTPS ✅)
- PocketBase: `https://your-domain.com` or `https://tunnel-url` (HTTPS ✅)

## After Setting Up HTTPS

1. **Update Environment Variables** in Netlify:
   - `VITE_POCKETBASE_URL` = `https://your-https-pocketbase-url`

2. **Update Environment Variables** in Vercel (Backoffice):
   - `VITE_POCKETBASE_URL` = `https://your-https-pocketbase-url`

3. **Redeploy** both applications

4. **Test**: The Mixed Content error should be gone

## Need Help?

If you need help setting up any of these options, let me know which approach you prefer and I can provide detailed step-by-step instructions.

