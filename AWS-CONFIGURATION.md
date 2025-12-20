# AWS Configuration Guide

This guide explains how to configure the frontend and backoffice to connect to PocketBase running on AWS.

## Overview

The project has three main components that need to connect to PocketBase:
1. **Frontend** (React/Vite app) - User-facing application
2. **Backoffice** (React/Vite admin dashboard) - Administrative interface
3. **PocketBase Scripts** (Node.js) - Database setup and management scripts

## AWS PocketBase Instance

- **URL**: `http://54.153.95.239:8096`
- **Admin Panel**: `http://54.153.95.239:8096/_/`
- **API Endpoint**: `http://54.153.95.239:8096/api/`

## Configuration Files

### 1. Root `.env` File

Located at: `/Users/mainaksaha/Desktop/MASTERS/Project/QUITHERO/.env`

This file contains configuration for PocketBase scripts:

```env
# AWS Configuration (Primary for scripts)
AWS_POCKETBASE_URL=http://54.153.95.239:8096
AWS_PB_ADMIN_EMAIL=mainaksaha0807@gmail.com
AWS_PB_ADMIN_PASSWORD=8104760831Ms@

# Frontend/Backoffice Configuration
VITE_POCKETBASE_URL=http://54.153.95.239:8096
export VITE_POCKETBASE_URL=http://54.153.95.239:8096

# Local Configuration (Fallback)
PB_ADMIN_EMAIL=mainaksaha0807@gmail.com
PB_ADMIN_PASSWORD=8104760831
```

### 2. Frontend `.env` File

Located at: `/Users/mainaksaha/Desktop/MASTERS/Project/QUITHERO/frontend/.env`

```env
VITE_POCKETBASE_URL=http://54.153.95.239:8096
```

**How it works:**
- Vite automatically loads `.env` files in the frontend directory
- The `VITE_` prefix makes the variable available to the frontend code
- Used in `frontend/lib/pocketbase.ts` to initialize PocketBase client

### 3. Backoffice `.env` File

Located at: `/Users/mainaksaha/Desktop/MASTERS/Project/QUITHERO/backoffice/.env`

```env
VITE_POCKETBASE_URL=http://54.153.95.239:8096
VITE_BACKOFFICE_PB_URL=http://54.153.95.239:8096
```

**How it works:**
- Vite automatically loads `.env` files in the backoffice directory
- Uses `VITE_POCKETBASE_URL` or `VITE_BACKOFFICE_PB_URL` (in that order)
- Used in `backoffice/src/lib/pocketbase.ts` to initialize PocketBase client

## Important Notes

### URL Format

⚠️ **Important**: The PocketBase client needs the **base URL without the `/_/` suffix**.

- ✅ **Correct**: `http://54.153.95.239:8096`
- ❌ **Wrong**: `http://54.153.95.239:8096/_/`

The `/_/` suffix is only for the admin panel URL in the browser, not for API connections.

### Environment Variable Priority

**For Frontend/Backoffice:**
1. `.env` file in respective directory (frontend/.env or backoffice/.env)
2. System environment variables
3. Default fallback: `http://localhost:8096`

**For PocketBase Scripts:**
1. `AWS_POCKETBASE_URL` (primary for AWS)
2. `VITE_POCKETBASE_URL` (fallback)
3. Default: `http://localhost:8096`

## Verification

### Check Frontend Configuration

```bash
cd frontend
cat .env
# Should show: VITE_POCKETBASE_URL=http://54.153.95.239:8096
```

### Check Backoffice Configuration

```bash
cd backoffice
cat .env
# Should show:
# VITE_POCKETBASE_URL=http://54.153.95.239:8096
# VITE_BACKOFFICE_PB_URL=http://54.153.95.239:8096
```

### Test Connection

**Frontend:**
```bash
cd frontend
npm run dev
# Check browser console for: "PocketBase URL: http://54.153.95.239:8096"
```

**Backoffice:**
```bash
cd backoffice
npm run dev
# Check browser console for: "[Backoffice] PocketBase URL: http://54.153.95.239:8096"
```

## Building for Production

When building for production, the `.env` files are used at build time:

```bash
# Frontend
cd frontend
npm run build
# The built app will use VITE_POCKETBASE_URL from .env

# Backoffice
cd backoffice
npm run build
# The built app will use VITE_POCKETBASE_URL from .env
```

## Troubleshooting

### Issue: Still connecting to localhost

**Solution:**
1. Verify `.env` files exist in `frontend/` and `backoffice/` directories
2. Check that `VITE_POCKETBASE_URL` is set correctly (no `/_/` suffix)
3. Restart the dev server after changing `.env` files
4. Clear browser cache if needed

### Issue: CORS errors

**Solution:**
- Ensure AWS Security Group allows traffic on port 8096
- Check PocketBase CORS settings in admin panel
- Verify the URL doesn't have `/_/` suffix

### Issue: Connection timeout

**Solution:**
- Verify AWS Security Group is configured correctly
- Check if PocketBase container is running: `docker-compose ps`
- Test connection: `curl http://54.153.95.239:8096/api/health`

## Quick Setup Script

To quickly set up AWS configuration:

```bash
# From project root
echo "VITE_POCKETBASE_URL=http://54.153.95.239:8096" > frontend/.env
echo -e "VITE_POCKETBASE_URL=http://54.153.95.239:8096\nVITE_BACKOFFICE_PB_URL=http://54.153.95.239:8096" > backoffice/.env
```

## Current Configuration Status

✅ **Root .env**: Configured with AWS URL
✅ **Frontend .env**: Created with AWS URL
✅ **Backoffice .env**: Created with AWS URL
✅ **PocketBase Scripts**: Use AWS_POCKETBASE_URL from root .env

All components are now configured to connect to AWS PocketBase instance at `http://54.153.95.239:8096`.
