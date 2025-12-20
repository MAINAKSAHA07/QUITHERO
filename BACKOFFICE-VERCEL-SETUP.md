# Backoffice Vercel Deployment Setup

## Configuration

The backoffice has its own `vercel.json` file in the `backoffice/` directory.

## Important: Vercel Project Settings

When deploying the backoffice to Vercel, you need to configure it correctly:

### Option 1: Deploy from backoffice directory (Recommended)

1. In Vercel Dashboard, create a **new project** or select your backoffice project
2. Connect it to your repository
3. In **Project Settings** → **General** → **Root Directory**:
   - Set to: `backoffice`
4. In **Build & Development Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Save and redeploy

### Option 2: Use vercel.json (Already configured)

The `backoffice/vercel.json` file is already configured. Just make sure:
- The Vercel project root is set to `backoffice/` directory
- Or deploy from the `backoffice/` subdirectory

## Environment Variables

Don't forget to set environment variables in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - **Key**: `VITE_POCKETBASE_URL`
   - **Value**: `http://54.153.95.239:8096`
   - **Environment**: Production, Preview, Development

## Build Verification

The build should create:
```
backoffice/dist/
├── index.html
├── assets/
│   ├── main-*.js
│   ├── main-*.css
│   └── vendor chunks
```

## Troubleshooting

### Error: "Could not read package.json"

**Cause**: Vercel is looking in the wrong directory.

**Fix**: 
1. Check **Root Directory** in Vercel project settings
2. Should be set to: `backoffice`
3. Or ensure `vercel.json` is in the `backoffice/` directory

### Error: "No Output Directory named 'dist' found"

**Cause**: Build failed or dist wasn't created.

**Fix**:
1. Check build logs for TypeScript errors
2. Verify `backoffice/vite.config.ts` has `outDir: 'dist'`
3. Test build locally: `cd backoffice && npm run build`

## Current Configuration

- **Root Directory**: `backoffice/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
