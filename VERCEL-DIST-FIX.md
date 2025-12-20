# Fix: Vercel "No Output Directory named 'dist' found"

## The Problem

Vercel can't find the `dist` directory after build. This usually happens when:
1. The build fails before creating dist
2. Vercel is looking in the wrong location
3. Build output is in a different directory

## Solution 1: Verify Build Command

Make sure your `vercel.json` has:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## Solution 2: Check Vercel Build Logs

1. Go to Vercel Dashboard → Your Project
2. Click on the failed deployment
3. Check the **Build Logs** tab
4. Look for:
   - ✅ `✓ built in X.XXs` (build succeeded)
   - ❌ Any TypeScript errors
   - ❌ Any build failures

## Solution 3: Manual Configuration in Vercel Dashboard

If `vercel.json` isn't working:

1. Go to **Project Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Set:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Save**
5. Redeploy

## Solution 4: Verify Build Locally

Test the build locally first:
```bash
# Clean previous build
rm -rf dist

# Run build
npm run build

# Verify dist exists
ls -la dist/

# Should see:
# - index.html
# - assets/ directory
```

If local build fails, fix those errors first.

## Solution 5: Check TypeScript Errors

The build command is `tsc && vite build`. If TypeScript fails, `vite build` never runs.

Check for TypeScript errors:
```bash
npm run build 2>&1 | grep -i error
```

Fix any TypeScript errors before deploying.

## Solution 6: Alternative Build Command

If the build is still failing, try this in `vercel.json`:

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist"
}
```

## Common Issues

### Issue: TypeScript compilation fails
**Fix**: Resolve all TypeScript errors. The build stops if `tsc` fails.

### Issue: Missing dependencies
**Fix**: Ensure `package.json` has all required dependencies.

### Issue: Wrong working directory
**Fix**: Make sure `vercel.json` is in the project root.

### Issue: Build timeout
**Fix**: Vercel has build time limits. Optimize your build or contact Vercel support.

## Verification

After fixing, verify:
1. Build completes successfully in Vercel logs
2. `dist` directory is created
3. `dist/index.html` exists
4. Deployment succeeds

## Current Configuration

Your `vercel.json` should be:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rootDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Still Not Working?

1. Check Vercel build logs for specific errors
2. Try building locally: `npm run build`
3. Verify `dist/index.html` exists after local build
4. Check if there are any TypeScript errors
5. Ensure all dependencies are in `package.json`
