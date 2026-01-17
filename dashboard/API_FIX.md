# 🔧 API URL Fix

## The Problem

The dashboard is trying to connect to `http://api:8000` which is a Docker hostname that doesn't work in the browser. The browser can't resolve `api` as a hostname.

## ✅ Solution

### Option 1: Use .env.local (Recommended)

The `.env.local` file has been created with the correct URL. **Restart your dev server** to pick up the change:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd dashboard
npm run dev
```

### Option 2: Verify .env.local

Make sure `dashboard/.env.local` contains:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Option 3: Manual Override

If the above doesn't work, you can temporarily set it in the browser console:

```javascript
// This won't persist, but will work for current session
window.__API_URL__ = 'http://localhost:8000'
```

## 🔍 Verify It's Fixed

After restarting, check the browser console. You should see:
- ✅ Requests going to `http://localhost:8000` (not `http://api:8000`)
- ✅ If API is not running, you'll see network errors (this is OK)
- ✅ Dashboard should still load with empty states

## 📝 What Changed

1. ✅ Updated `next.config.js` default from `http://api:8000` to `http://localhost:8000`
2. ✅ Created `.env.local` with correct API URL
3. ✅ Dashboard will now work even if API is not running (shows empty states)

## 🚀 Next Steps

1. **Restart dev server** (important!)
2. **Refresh browser**
3. **Check console** - should see `localhost:8000` instead of `api:8000`

If API is not running, the dashboard will show empty states but won't crash!
