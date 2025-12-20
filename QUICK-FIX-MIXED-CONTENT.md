# Quick Fix: Mixed Content Error

## ✅ Security Group Already Configured!

Your AWS security group is correctly set up with ports 80, 443, and 8096 open.

## 🚀 Quick Solution: Cloudflare Tunnel (Recommended - No Domain Needed)

### Step 1: Set Up Cloudflare Tunnel on EC2

**SSH into your EC2 instance:**
```bash
ssh -i quithero.pem ec2-user@54.153.95.239
```

**Upload and run the script:**
```bash
# From your local machine, upload the script:
scp -i quithero.pem setup-cloudflare-tunnel.sh ec2-user@54.153.95.239:~/

# SSH into the instance:
ssh -i quithero.pem ec2-user@54.153.95.239

# Run the script:
sudo bash setup-cloudflare-tunnel.sh
```

**Follow the prompts:**
- It will open a browser for Cloudflare authentication
- Login to Cloudflare (create free account if needed)
- The script will automatically set everything up

**You'll get a URL like:** `https://quithero-pb.trycloudflare.com`

### Step 2: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **backoffice project**
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:
   - **Key**: `VITE_POCKETBASE_URL`
   - **Value**: `https://quithero-pb.trycloudflare.com` (use your actual tunnel URL)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   - **Key**: `VITE_BACKOFFICE_PB_URL` (optional, but recommended)
   - **Value**: `https://quithero-pb.trycloudflare.com`
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

5. **Redeploy** your application:
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**

### Step 3: Update PocketBase CORS

1. Access PocketBase Admin: `https://quithero-pb.trycloudflare.com/_/`
2. Login with your admin credentials
3. Go to **Settings** → **API** → **CORS**
4. Add these domains:
   - `https://quitherobackoffice.vercel.app`
   - `https://quithero.netlify.app`
5. Click **Save**

### Step 4: Test

1. **Test the tunnel URL:**
   ```bash
   curl https://quithero-pb.trycloudflare.com/api/health
   ```

2. **Test from browser:**
   - Visit `https://quitherobackoffice.vercel.app/login`
   - Try logging in
   - Mixed Content error should be gone! ✅

---

## Alternative: Nginx + Let's Encrypt (If You Have a Domain)

If you have a domain name (e.g., `pb.quithero.com`):

### Step 1: Set Up HTTPS

```bash
# SSH into EC2
ssh -i quithero.pem ec2-user@54.153.95.239

# Upload and run the HTTPS setup script
scp -i quithero.pem setup-aws-https.sh ec2-user@54.153.95.239:~/
sudo bash setup-aws-https.sh
```

### Step 2: Update DNS

Point your domain to EC2:
- **A Record**: `pb.quithero.com` → `54.153.95.239`

### Step 3: Update Vercel Environment Variables

Same as Step 2 above, but use your domain URL:
- `VITE_POCKETBASE_URL=https://pb.quithero.com`

---

## Current Status

❌ **Current (Broken):**
- Backoffice: `https://quitherobackoffice.vercel.app` (HTTPS ✅)
- PocketBase: `http://54.153.95.239:8096` (HTTP ❌)
- **Result**: Mixed Content Error

✅ **After Fix:**
- Backoffice: `https://quitherobackoffice.vercel.app` (HTTPS ✅)
- PocketBase: `https://quithero-pb.trycloudflare.com` (HTTPS ✅)
- **Result**: No Mixed Content Error! ✅

---

## Troubleshooting

### Tunnel Not Working
```bash
# Check tunnel status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f
```

### Environment Variable Not Updating
- Make sure you **redeploy** after updating environment variables
- Check the variable name: `VITE_POCKETBASE_URL` (not `VITE_PB_URL`)
- Clear browser cache

### Still Getting Mixed Content Error
1. Verify the environment variable is set correctly in Vercel
2. Check the build logs to see what URL is being used
3. Make sure you redeployed after updating the variable
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

---

## Need Help?

If you encounter issues:
1. Check Cloudflare Tunnel logs: `sudo journalctl -u cloudflared -n 50`
2. Verify PocketBase is running: `docker ps` or `systemctl status pocketbase`
3. Test the tunnel URL directly: `curl https://quithero-pb.trycloudflare.com/api/health`

