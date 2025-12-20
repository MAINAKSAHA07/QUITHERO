#!/bin/bash
# Vercel build script to ensure dist directory is created

set -e

echo "🔨 Starting build process..."

# Run the build
npm run build

# Verify dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ ERROR: dist directory was not created!"
  echo "Build output:"
  ls -la
  exit 1
fi

# Verify index.html exists
if [ ! -f "dist/index.html" ]; then
  echo "❌ ERROR: dist/index.html was not created!"
  echo "dist directory contents:"
  ls -la dist/
  exit 1
fi

echo "✅ Build successful! dist directory created with:"
ls -la dist/ | head -10
