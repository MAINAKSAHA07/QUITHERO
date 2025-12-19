# 🚀 Quick Fix - 3 Steps to Fix Backoffice

## The Problem
Backoffice can't see users because of PocketBase permissions.

## The Fix (5 minutes)

### 1️⃣ Open PocketBase Admin
```
http://localhost:8096/_/
```
Login: `mainaksaha0807@gmail.com` / `8104760831`

### 2️⃣ Update Users Collection Rules
1. Go to: **Collections** → **users** → **API Rules** tab
2. Update these rules:

**List/Search Rule:**
```
@request.auth.collectionName = "admin_users" || @request.auth.id != ""
```

**View Rule:**
```
@request.auth.collectionName = "admin_users" || @request.auth.id = id
```

3. Click **Save changes**

### 3️⃣ Restart Backoffice
```bash
# Stop current server (Ctrl+C), then:
cd backoffice
npm run dev
```

## ✅ Verify It Works
```bash
node verify-backoffice.js
```

Should show: "🎉 SUCCESS! Backoffice is properly configured!"

## 🌐 Login to Backoffice
- URL: `http://localhost:5176`
- Email: `mainak.tln@gmail.com`
- Password: `8104760831`

---

**Need detailed instructions?** → See `SETUP_INSTRUCTIONS.md`
