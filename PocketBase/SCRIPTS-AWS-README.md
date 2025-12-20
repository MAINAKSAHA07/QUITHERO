# PocketBase Scripts - AWS Configuration

All PocketBase scripts have been updated to work with AWS environment variables from the `.env` file.

## Environment Variables

All scripts now use the following environment variables (in priority order):

### PocketBase URL
- **Primary**: `AWS_POCKETBASE_URL` (e.g., `http://54.153.95.239:8096/_/`)
- **Fallback**: `VITE_POCKETBASE_URL` (e.g., `http://localhost:8096`)
- **Default**: `http://localhost:8096`

### Admin Credentials
- **Primary**: `AWS_PB_ADMIN_EMAIL` and `AWS_PB_ADMIN_PASSWORD`
- **Fallback**: `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD`

## Updated Scripts

All scripts now use the shared `utils.js` module which:
- Automatically loads `.env` file from project root
- Handles AWS environment variables
- Validates required credentials
- Provides consistent configuration across all scripts

### Main Setup Scripts
- ✅ `complete-setup.js` - Complete database setup (collections, rules, seeding)
- ✅ `setup-pocketbase.js` - Basic collection creation
- ✅ `set-rules.js` - Set access control rules

### Seeding Scripts
- ✅ `seed-full-program.js` - Seed complete 10-day program
- ✅ `seed-program.js` - Seed program data
- ✅ `seed-sample.js` - Seed sample data for testing

### Fix Scripts
- ✅ `fix-schemas.js` - Fix collection schemas
- ✅ `fix-user-sessions.js` - Fix user sessions collection
- ✅ `fix-cravings-collection.js` - Fix cravings collection
- ✅ `fix-pocketbase-permissions.js` - Fix users collection permissions
- ✅ `fix-program-permissions.js` - Fix programs collection permissions
- ✅ `fix-support-tickets-permissions.js` - Fix support tickets permissions
- ✅ `fix-remaining.js` - Fix remaining collections

### Verification Scripts
- ✅ `verify-backoffice.js` - Verify backoffice access

## Usage

All scripts automatically load the `.env` file and use AWS configuration when available:

```bash
# From project root
npm run pb:complete-setup
npm run pb:setup
npm run pb:rules
npm run pb:seed-program
npm run pb:seed-sample

# Or run directly
node PocketBase/complete-setup.js
node PocketBase/setup-pocketbase.js
node PocketBase/set-rules.js
```

## .env File Format

Your `.env` file should contain:

```env
# AWS Configuration (Primary)
AWS_POCKETBASE_URL=http://54.153.95.239:8096/_/
AWS_PB_ADMIN_EMAIL=mainaksaha0807@gmail.com
AWS_PB_ADMIN_PASSWORD=8104760831Ms@

# Local Configuration (Fallback)
VITE_POCKETBASE_URL=http://localhost:8096
PB_ADMIN_EMAIL=mainaksaha0807@gmail.com
PB_ADMIN_PASSWORD=8104760831
```

## Shared Utilities

The `utils.js` module provides:
- `loadEnv()` - Loads .env file
- `getPocketBaseURL()` - Gets PocketBase URL with AWS priority
- `getAdminEmail()` - Gets admin email with AWS priority
- `getAdminPassword()` - Gets admin password with AWS priority
- `validateCredentials()` - Validates required credentials
- `initPocketBase()` - Initializes and returns all configuration

## Notes

- All scripts work with both AWS and local configurations
- Scripts automatically strip `/_/` suffix from URLs (PocketBase client needs base URL)
- Scripts validate credentials and exit with clear error messages if missing
- All scripts are safe to run multiple times (idempotent)
