# AWS HTTPS Setup Guide for PocketBase

## Quick Setup Steps

### 1. Update AWS Security Group

**Via AWS Console:**
1. Go to [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **Security Groups** in the left sidebar
3. Find the security group attached to your EC2 instance (`54.153.95.239`)
4. Click **Edit inbound rules**
5. Add these rules:
   - **Type**: HTTP, **Port**: 80, **Source**: 0.0.0.0/0, **Description**: Let's Encrypt HTTP
   - **Type**: HTTPS, **Port**: 443, **Source**: 0.0.0.0/0, **Description**: HTTPS Access
6. Click **Save rules**

**Via AWS CLI:**
```bash
# Get your security group ID first
aws ec2 describe-instances --instance-ids i-xxxxx --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Add HTTP rule
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Add HTTPS rule
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
```

### 2. Run HTTPS Setup Script

**SSH into your EC2 instance:**
```bash
ssh -i quithero.pem ec2-user@54.153.95.239
```

**Upload and run the script:**
```bash
# Upload the script (from your local machine)
scp -i quithero.pem setup-aws-https.sh ec2-user@54.153.95.239:~/

# SSH into the instance
ssh -i quithero.pem ec2-user@54.153.95.239

# Run the script
sudo bash setup-aws-https.sh
```

**Follow the prompts:**
- Enter your domain name (e.g., `pb.quithero.com`)
- Make sure DNS points to your EC2 IP (`54.153.95.239`)
- Enter your email for Let's Encrypt

### 3. Update DNS (If Using Custom Domain)

If you're using a custom domain, point it to your EC2 instance:

**A Record:**
- **Name**: `pb` (or `@` for root domain)
- **Type**: A
- **Value**: `54.153.95.239`
- **TTL**: 300 (or default)

### 4. Update Vercel Environment Variables

**For Backoffice (Vercel):**
1. Go to your Vercel project: [quitherobackoffice](https://vercel.com/your-project/settings/environment-variables)
2. Go to **Settings** → **Environment Variables**
3. Add/Update:
   - **Key**: `VITE_POCKETBASE_URL`
   - **Value**: `https://your-domain.com` (or `https://pb.quithero.com`)
   - **Environment**: Production, Preview, Development
4. Click **Save**
5. **Redeploy** the application

**For Frontend (if using Vercel/Netlify):**
- Same steps as above
- Update `VITE_POCKETBASE_URL` to the HTTPS URL

### 5. Update PocketBase CORS Settings

1. Access PocketBase Admin: `https://your-domain.com/_/`
2. Login with admin credentials
3. Go to **Settings** → **API** → **CORS**
4. Add your frontend domains:
   - `https://quitherobackoffice.vercel.app`
   - `https://your-frontend-domain.com`
5. Click **Save**

### 6. Test

1. **Test HTTPS URL:**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Test from browser:**
   - Visit `https://your-domain.com/_/`
   - Should see PocketBase admin login (over HTTPS)

3. **Test from backoffice:**
   - Try logging in at `https://quitherobackoffice.vercel.app/login`
   - Mixed Content error should be gone!

## Alternative: Cloudflare Tunnel (No Domain Needed)

If you don't have a domain, use Cloudflare Tunnel instead:

See: `CLOUDFLARE-TUNNEL-SETUP.md`

## Troubleshooting

### Certificate Not Issuing
- **Check DNS**: `dig your-domain.com +short` should return `54.153.95.239`
- **Check Port 80**: `curl http://your-domain.com` should work
- **Check Nginx**: `sudo systemctl status nginx`

### Mixed Content Still Appearing
- Clear browser cache
- Check Vercel environment variables are updated
- Verify the variable name: `VITE_POCKETBASE_URL` (not `VITE_PB_URL`)
- Redeploy after updating environment variables

### Nginx Not Starting
```bash
sudo nginx -t  # Test configuration
sudo systemctl status nginx  # Check status
sudo journalctl -u nginx -n 50  # View logs
```

### Certificate Renewal
Certificates auto-renew, but you can test:
```bash
sudo certbot renew --dry-run
```

## Security Notes

✅ **HTTPS is now enabled** - All traffic is encrypted  
✅ **Auto-renewal enabled** - Certificate renews automatically  
✅ **Security group updated** - Only ports 80 and 443 open to public  
✅ **Nginx reverse proxy** - Protects PocketBase from direct exposure  

## Current Configuration

After setup:
- **PocketBase URL**: `https://your-domain.com`
- **Admin UI**: `https://your-domain.com/_/`
- **API**: `https://your-domain.com/api/`

## Need Help?

If you encounter issues:
1. Check Nginx logs: `sudo journalctl -u nginx -f`
2. Check Certbot logs: `sudo journalctl -u certbot -f`
3. Verify security group rules in AWS Console
4. Test DNS resolution: `dig your-domain.com`

