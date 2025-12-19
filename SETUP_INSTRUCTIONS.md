# PocketBase Backoffice Setup Instructions

## Issue Summary
The backoffice cannot display user data because the `admin_users` collection doesn't have permission to read the `users` auth collection in PocketBase.

## ✅ What's Already Fixed
- Backoffice is connecting to the correct PocketBase port (8096)
- Environment variables are properly configured
- Admin authentication is working

## 🔧 What You Need to Fix (5 minutes)

### Step 1: Open PocketBase Admin UI

1. Open your browser and go to: **http://localhost:8096/_/**
2. You should see the PocketBase login screen

### Step 2: Login to PocketBase

- **Email**: `mainaksaha0807@gmail.com`
- **Password**: `8104760831`
- Click "Login"

### Step 3: Navigate to Collections

1. In the left sidebar, click on **"Collections"**
2. Find and click on the **"users"** collection (it should have an icon indicating it's an auth collection)

### Step 4: Update API Rules

1. Click on the **"API Rules"** tab at the top
2. You'll see different rule types: List/Search, View, Create, Update, Delete

#### Update "List/Search" Rule:
- Click the **pencil/edit icon** next to "List/Search"
- Replace the existing rule with:
  ```
  @request.auth.collectionName = "admin_users" || @request.auth.id != ""
  ```
- This allows both admin_users and authenticated regular users to list/search

#### Update "View" Rule:
- Click the **pencil/edit icon** next to "View"
- Replace the existing rule with:
  ```
  @request.auth.collectionName = "admin_users" || @request.auth.id = id
  ```
- This allows admin_users to view any user, and users to view their own profile

#### Optional: Update "Update" Rule (if you want admins to edit users):
- Click the **pencil/edit icon** next to "Update"
- Replace with:
  ```
  @request.auth.collectionName = "admin_users" || @request.auth.id = id
  ```

#### Optional: Update "Delete" Rule (if you want admins to delete users):
- Click the **pencil/edit icon** next to "Delete"
- Replace with:
  ```
  @request.auth.collectionName = "admin_users"
  ```

### Step 5: Save Changes

1. Click the **"Save changes"** button at the bottom
2. You should see a success message

### Step 6: Restart Backoffice (Important!)

Open your terminal where the backoffice is running:
1. Press `Ctrl+C` to stop the dev server
2. Run:
   ```bash
   cd backoffice
   npm run dev
   ```

### Step 7: Test the Backoffice

1. Open: **http://localhost:5176**
2. Login with:
   - **Email**: `mainak.tln@gmail.com`
   - **Password**: `8104760831`
3. You should now see:
   - Users in the dashboard
   - User count metrics
   - All other data properly displayed

## 🧪 Verify It Works

After completing the steps above, you can run this verification command:

```bash
node fix-pocketbase-permissions.js
```

It should show that admin users can now access the users collection.

## Alternative: Quick Fix (Development Only)

If you want a simpler rule for development (less secure, but easier):

**List/Search Rule:**
```
@request.auth.id != ""
```

**View Rule:**
```
@request.auth.id != ""
```

This allows ANY authenticated user (from any collection) to view users. Only use this for development!

## Troubleshooting

### "Still seeing 0 users in backoffice"
1. Make sure you clicked "Save changes" in PocketBase
2. Make sure you restarted the backoffice dev server
3. Clear your browser cache or try in incognito mode
4. Check browser console for errors (F12 → Console tab)

### "Cannot login to PocketBase Admin UI"
- The system admin might not exist yet
- Try creating one by running PocketBase with admin create command
- Or use the regular user credentials: `mainaksaha0807@gmail.com` / `8104760831`

### "Users collection not found"
- The users collection should exist by default
- Check if it's named differently in your setup
- Look for collections with an auth icon

## Current Database Status

- **Users**: 1 user (`mainaksaha0807@gmail.com`)
- **Admin Users**: 1 admin (`mainak.tln@gmail.com`)
- **Programs**: 7 programs
- **Program Days**: 12 days
- **Steps**: 34 steps

Once you update the permissions, all this data will be visible in the backoffice!
