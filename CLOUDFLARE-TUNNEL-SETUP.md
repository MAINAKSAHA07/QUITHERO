# Cloudflare Tunnel Setup - Quick HTTPS Solution

## Why Cloudflare Tunnel?

You tried to use `quithero.netlify.app` but that's a Netlify domain that doesn't point to your EC2 server. 

**Cloudflare Tunnel provides free HTTPS without needing a domain name!**

## Quick Setup

### Option 1: Automated Script (Recommended)

1. **On your EC2 instance**, run:
   ```bash
   sudo bash setup-cloudflare-tunnel.sh
   ```

2. **Follow the prompts**:
   - It will open a browser for authentication (or give you a URL)
   - Login to Cloudflare
   - The script will create and start the tunnel

3. **Get your HTTPS URL**:
   - The script will output something like: `https://quithero-pb-1234567890.trycloudflare.com`
   - This is your PocketBase HTTPS URL!

4. **Update environment variables**:
   - Netlify: `VITE_POCKETBASE_URL` = `https://your-tunnel-url.trycloudflare.com`
   - Vercel: `VITE_POCKETBASE_URL` = `https://your-tunnel-url.trycloudflare.com`

5. **Redeploy** both applications

### Option 2: Manual Setup

If the script doesn't work, follow these steps:

1. **Install Cloudflare Tunnel**:
   ```bash
   cd /tmp
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   chmod +x cloudflared-linux-amd64
   sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
   ```

2. **Authenticate**:
   ```bash
   cloudflared tunnel login
   ```
   - This will open a browser or give you a URL
   - Login to Cloudflare (create free account if needed)

3. **Create Tunnel**:
   ```bash
   cloudflared tunnel create quithero-pb
   ```

4. **Get Tunnel ID**:
   ```bash
   cloudflared tunnel list
   ```
   - Note the UUID for `quithero-pb`

5. **Create Config** (`~/.cloudflared/config.yml`):
   ```yaml
   tunnel: <your-tunnel-id>
   credentials-file: /root/.cloudflared/<tunnel-id>.json
   
   ingress:
     - hostname: quithero-pb.trycloudflare.com
       service: http://localhost:8096
     - service: http_status:404
   ```

6. **Run Tunnel**:
   ```bash
   cloudflared tunnel --config ~/.cloudflared/config.yml run <tunnel-id>
   ```

7. **Run as Service** (so it starts on boot):
   ```bash
   sudo nano /etc/systemd/system/cloudflared.service
   ```
   
   Add:
   ```ini
   [Unit]
   Description=Cloudflare Tunnel
   After=network.target
   
   [Service]
   Type=simple
   ExecStart=/usr/local/bin/cloudflared tunnel --config /root/.cloudflared/config.yml run <tunnel-id>
   Restart=on-failure
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   Then:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   ```

## Verify It's Working

1. **Check tunnel status**:
   ```bash
   sudo systemctl status cloudflared
   ```

2. **View logs**:
   ```bash
   sudo journalctl -u cloudflared -f
   ```

3. **Test the URL**:
   - Visit `https://your-tunnel-url.trycloudflare.com/_/` in your browser
   - Should see PocketBase admin login

## Update Environment Variables

After getting your tunnel URL:

1. **Netlify**:
   - Settings → Environment Variables
   - `VITE_POCKETBASE_URL` = `https://your-tunnel-url.trycloudflare.com`

2. **Vercel (Backoffice)**:
   - Settings → Environment Variables
   - `VITE_POCKETBASE_URL` = `https://your-tunnel-url.trycloudflare.com`

3. **Redeploy** both applications

## Advantages

✅ **Free HTTPS** - No SSL certificate needed  
✅ **No Domain Required** - Works with free `.trycloudflare.com` subdomain  
✅ **Secure** - Encrypted tunnel  
✅ **Easy Setup** - Automated script handles everything  

## Custom Domain (Optional)

If you want to use your own domain later:

1. Add your domain to Cloudflare
2. Update the tunnel config:
   ```yaml
   ingress:
     - hostname: pb.yourdomain.com
       service: http://localhost:8096
   ```
3. Update DNS in Cloudflare to point to the tunnel

## Troubleshooting

### Tunnel not starting
```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 50
```

### Can't access PocketBase
- Check if PocketBase is running: `docker ps`
- Check tunnel logs for errors
- Verify the service URL in config is `http://localhost:8096`

### Need to restart tunnel
```bash
sudo systemctl restart cloudflared
```

## That's It!

Once set up, you'll have a free HTTPS URL for PocketBase that works with your Netlify/Vercel deployments!
