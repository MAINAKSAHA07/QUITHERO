#!/bin/bash

# Setup AWS Environment Configuration
# This script configures frontend and backoffice to connect to AWS PocketBase

set -e

AWS_PB_URL="http://54.153.95.239:8096"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 Setting up AWS PocketBase configuration..."
echo ""

# Frontend .env
echo "📱 Configuring Frontend..."
FRONTEND_ENV="${PROJECT_ROOT}/frontend/.env"
echo "VITE_POCKETBASE_URL=${AWS_PB_URL}" > "${FRONTEND_ENV}"
echo "  ✓ Created ${FRONTEND_ENV}"

# Backoffice .env
echo "🖥️  Configuring Backoffice..."
BACKOFFICE_ENV="${PROJECT_ROOT}/backoffice/.env"
cat > "${BACKOFFICE_ENV}" << EOF
VITE_POCKETBASE_URL=${AWS_PB_URL}
VITE_BACKOFFICE_PB_URL=${AWS_PB_URL}
EOF
echo "  ✓ Created ${BACKOFFICE_ENV}"

# Update root .env if needed
echo "📝 Checking root .env..."
ROOT_ENV="${PROJECT_ROOT}/.env"
if [ -f "${ROOT_ENV}" ]; then
  # Update VITE_POCKETBASE_URL if it's still localhost
  if grep -q "VITE_POCKETBASE_URL=http://localhost:8096" "${ROOT_ENV}"; then
    sed -i.bak "s|VITE_POCKETBASE_URL=http://localhost:8096|VITE_POCKETBASE_URL=${AWS_PB_URL}|g" "${ROOT_ENV}"
    sed -i.bak "s|export VITE_POCKETBASE_URL=http://localhost:8096|export VITE_POCKETBASE_URL=${AWS_PB_URL}|g" "${ROOT_ENV}"
    echo "  ✓ Updated VITE_POCKETBASE_URL in root .env"
  else
    echo "  ✓ Root .env already configured"
  fi
else
  echo "  ⚠ Root .env not found, skipping..."
fi

echo ""
echo "✅ AWS Configuration Complete!"
echo ""
echo "📋 Configuration Summary:"
echo "   Frontend: ${FRONTEND_ENV}"
echo "   Backoffice: ${BACKOFFICE_ENV}"
echo "   PocketBase URL: ${AWS_PB_URL}"
echo ""
echo "🚀 Next Steps:"
echo "   1. Restart dev servers if running:"
echo "      - Frontend: npm run dev (in frontend/)"
echo "      - Backoffice: npm run dev (in backoffice/)"
echo ""
echo "   2. Build for production:"
echo "      - Frontend: cd frontend && npm run build"
echo "      - Backoffice: cd backoffice && npm run build"
echo ""
echo "   3. Verify connection:"
echo "      - Check browser console for PocketBase URL"
echo "      - Test login functionality"
echo ""
