# 🚨 URGENT: Backoffice Still Using Localhost

## The Problem

Your backoffice at `https://quitherobackoffice.vercel.app` is still trying to connect to `localhost:8096` instead of AWS.

**This means the environment variable `VITE_POCKETBASE_URL` is NOT set in Vercel for the backoffice project.**

## The Fix (5 minutes)

### Step 1: Set Environment Variable in Vercel

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Click on your **Backoffice Project** (quitherobackoffice)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `VITE_POCKETBASE_URL`
   - **Value**: `http://54.153.95.239:8096`
   - **Environment**: ✅ Check ALL three:
     - Production
     - Preview  
     - Development
6. Click **Save**

### Step 2: Redeploy

**CRITICAL**: Environment variables only take effect after a new deployment!

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (optional, faster)
5. Click **Redeploy**
6. Wait for deployment to complete (~2-3 minutes)

### Step 3: Verify

1. Open your deployed backoffice: `https://quitherobackoffice.vercel.app`
2. Open browser console (F12)
3. You should see:
   ```
   [Backoffice] PocketBase URL: http://54.153.95.239:8096
   ```
4. ❌ If you still see `localhost:8096` or a warning, the env var wasn't set correctly

## Using Vercel CLI (Alternative)

If you prefer CLI:

```bash
# Navigate to backoffice directory
cd backoffice

# Set environment variable
vercel env add VITE_POCKETBASE_URL production
# When prompted, enter: http://54.153.95.239:8096

# Also set for preview and development
vercel env add VITE_POCKETBASE_URL preview
# Enter: http://54.153.95.239:8096

vercel env add VITE_POCKETBASE_URL development
# Enter: http://54.153.95.239:8096

# Redeploy
vercel --prod
```

## Verify Environment Variables Are Set

Check if variables are set:

```bash
# Via CLI
vercel env ls

# Should show:
# VITE_POCKETBASE_URL (Production, Preview, Development)
```

Or in Vercel Dashboard:
- Settings → Environment Variables
- Should see `VITE_POCKETBASE_URL` listed

## Common Mistakes

1. ❌ **Setting variable but not redeploying** - Variables only apply to NEW deployments
2. ❌ **Setting only for Production** - Should set for all environments
3. ❌ **Wrong variable name** - Must be exactly `VITE_POCKETBASE_URL` (case-sensitive)
4. ❌ **Wrong URL format** - Use `http://54.153.95.239:8096` (NOT `http://54.153.95.239:8096/_/`)

## Why This Happens

Vite injects environment variables at **build time**, not runtime. This means:
- The variable must be set in Vercel **before** the build runs
- You must **redeploy** after setting the variable
- The variable is baked into the JavaScript bundle during build

## Quick Checklist

- [ ] Environment variable `VITE_POCKETBASE_URL` is set in Vercel
- [ ] Variable is set for Production, Preview, AND Development
- [ ] Value is exactly: `http://54.153.95.239:8096`
- [ ] Redeployed after setting the variable
- [ ] Checked browser console - shows AWS URL, not localhost

## Still Not Working?

1. **Check build logs** in Vercel:
   - Look for the PocketBase URL in the build output
   - Should show: `[Backoffice] PocketBase URL: http://54.153.95.239:8096`

2. **Verify variable is set**:
   ```bash
   vercel env ls
   ```

3. **Try clearing cache and redeploying**:
   - In Vercel, redeploy with "Clear build cache" option

4. **Check for typos**:
   - Variable name: `VITE_POCKETBASE_URL` (not `VITE_POCKETBASE_URLS` or similar)
   - URL: `http://54.153.95.239:8096` (no trailing slash, no `/_/`)

## That's It!

After setting the environment variable and redeploying, your backoffice will connect to AWS PocketBase instead of localhost.
