# ✅ All PocketBase Scripts Updated for AWS

## Summary

All 14 PocketBase scripts have been updated to work with AWS environment variables from the `.env` file. They now use a shared utility module (`utils.js`) for consistent configuration.

## ✅ Updated Scripts

### Setup Scripts
1. ✅ **complete-setup.js** - Complete database setup (collections, schemas, rules, seeding)
2. ✅ **setup-pocketbase.js** - Basic collection creation

### Configuration Scripts
3. ✅ **set-rules.js** - Set access control rules for all collections

### Seeding Scripts
4. ✅ **seed-full-program.js** - Seed complete 10-day program with all steps
5. ✅ **seed-program.js** - Seed program data
6. ✅ **seed-sample.js** - Seed sample data for testing

### Fix Scripts
7. ✅ **fix-schemas.js** - Fix collection schemas
8. ✅ **fix-user-sessions.js** - Fix user sessions collection
9. ✅ **fix-cravings-collection.js** - Fix cravings collection
10. ✅ **fix-pocketbase-permissions.js** - Fix users collection permissions
11. ✅ **fix-program-permissions.js** - Fix programs collection permissions
12. ✅ **fix-support-tickets-permissions.js** - Fix support tickets permissions
13. ✅ **fix-remaining.js** - Fix remaining collections

### Verification Scripts
14. ✅ **verify-backoffice.js** - Verify backoffice access

## 🔧 Shared Utility Module

**New file**: `PocketBase/utils.js`

This module provides:
- `.env` file loading
- AWS environment variable support
- Consistent configuration across all scripts
- Credential validation

## 📋 Environment Variables

All scripts now use (in priority order):

### URL
- `AWS_POCKETBASE_URL` (primary for AWS)
- `VITE_POCKETBASE_URL` (fallback for local)

### Credentials
- `AWS_PB_ADMIN_EMAIL` / `AWS_PB_ADMIN_PASSWORD` (primary for AWS)
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` (fallback for local)

## 🚀 Usage

All scripts work automatically with AWS when `.env` file contains AWS variables:

```bash
# From project root on AWS
cd ~/QUITHERO
npm run pb:complete-setup
npm run pb:setup
npm run pb:rules
npm run pb:seed-program
```

## ✅ Testing

Test script available:
```bash
node PocketBase/test-scripts.js
```

This verifies that:
- `.env` file loads correctly
- AWS environment variables are detected
- Configuration is valid

## 📝 Notes

- All scripts are **idempotent** (safe to run multiple times)
- Scripts automatically handle URL format (strips `/_/` suffix)
- Scripts validate credentials and provide clear error messages
- Works with both AWS and local configurations seamlessly

## 🔍 Verification Checklist

- [x] All scripts import `utils.js`
- [x] All scripts use `initPocketBase()` for configuration
- [x] No hardcoded localhost URLs (except in comments/docs)
- [x] All scripts support AWS environment variables
- [x] Shared utility handles .env loading
- [x] URL format handling (removes `/_/` suffix)
- [x] Credential validation in place

## 🎯 Next Steps

1. **Test on AWS**: Run `npm run pb:complete-setup` on your AWS instance
2. **Verify**: Check that all collections have proper schemas
3. **Seed Data**: Run seeding scripts to populate initial data
4. **Set Rules**: Run `npm run pb:rules` to set access control

All scripts are now ready for AWS deployment! 🚀
