# Schema Fix Guide - Collections Missing Fields

## Problem
Collections exist but only have ID field - all other schema fields are missing.

## Solution Approaches

### Option 1: Run the Updated Script (Recommended)
The `complete-setup.js` script has been updated with:
- Better schema detection
- Individual field addition fallback
- Detailed error logging

```bash
cd ~/QUITHERO
npm run pb:complete-setup
```

### Option 2: Use fix-schemas.js
Run the dedicated schema fix script:

```bash
node PocketBase/fix-schemas.js
```

### Option 3: Manual Fix via PocketBase Admin
1. Access PocketBase Admin: `http://54.153.95.239:8096/_/`
2. For each collection:
   - Click on the collection
   - Go to "Schema" tab
   - Add each missing field manually
   - Use the schema definitions from `setup-pocketbase.js` as reference

### Option 4: Delete and Recreate Collections
⚠️ **WARNING: This will delete all data!**

```bash
# Connect to PocketBase container
docker exec -it quit-hero-pb sh

# Delete pb_data to reset (this deletes ALL data)
rm -rf /pb/pb_data/*

# Restart container
docker-compose restart pocketbase

# Then run setup again
npm run pb:complete-setup
```

## Debugging

If schema updates are failing, check:

1. **PocketBase Logs**:
   ```bash
   docker-compose logs pocketbase | tail -50
   ```

2. **Test Schema Update Manually**:
   Use PocketBase Admin UI to add one field manually and see if it works.

3. **Check Collection Type**:
   Some collections might be `auth` type which has different schema requirements.

4. **Verify Admin Permissions**:
   Make sure you're authenticated as admin with full permissions.

## Expected Schema Fields

See `setup-pocketbase.js` for complete schema definitions for each collection.

## Common Issues

### Issue: "Something went wrong while processing your request"
- **Cause**: PocketBase API validation error
- **Solution**: Check PocketBase logs for detailed error
- **Workaround**: Try adding fields one at a time via admin UI

### Issue: Fields added but not visible
- **Cause**: Browser cache or PocketBase cache
- **Solution**: Refresh admin UI or wait a few seconds

### Issue: Schema update succeeds but fields still missing
- **Cause**: Collection might be locked or in use
- **Solution**: Restart PocketBase container
