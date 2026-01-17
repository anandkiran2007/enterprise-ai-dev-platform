# ⚡ Quick Fix for Blank Dashboard

## The Problem

You're seeing a blank/minimal page because:
1. **Authentication check** is redirecting you (no auth token)
2. **API is not running** (BFF service can't fetch data)

## 🚀 Quick Solution (30 seconds)

### Step 1: Open Browser Console

Press **F12** (or right-click → Inspect) and go to **Console** tab

### Step 2: Run This Code

Copy and paste this into the console:

```javascript
// Mock authentication for development
localStorage.setItem('auth_token', 'dev-token-12345')
localStorage.setItem('auth_user', JSON.stringify({
  id: 'dev-user-1',
  email: 'dev@example.com',
  name: 'Dev User',
  username: 'devuser',
  github_id: '12345'
}))
window.location.reload()
```

### Step 3: Dashboard Should Load!

After the page reloads, you should see:
- ✅ Full dashboard with metrics
- ✅ Navigation sidebar
- ✅ All pages accessible

## 🔍 If Still Not Working

### Check Browser Console for Errors

Look for red error messages. Common issues:

1. **"Cannot read property of undefined"**
   - The BFF service might be failing
   - Check if API is running: `curl http://localhost:8000/health`

2. **"Network request failed"**
   - API is not running (this is OK for UI testing)
   - Dashboard should still show with empty states

3. **"Module not found"**
   - Run: `cd dashboard && npm install`

### Alternative: Disable Auth Check Temporarily

Edit `dashboard/src/components/DashboardLayout.tsx`:

Find this code (around line 73-78):
```typescript
useEffect(() => {
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (!state.token && !storedToken) {
    router.replace('/')
  }
}, [state.token, router])
```

Comment it out:
```typescript
useEffect(() => {
  // Temporarily disabled for development
  // const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  // if (!state.token && !storedToken) {
  //   router.replace('/')
  // }
}, [state.token, router])
```

Then restart dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## ✅ Expected Result

After fixing, you should see:

1. **Dashboard Page** (`/dashboard`)
   - 4 metric cards (Organizations, Projects, Repositories, Agents)
   - Activity feed (may be empty)
   - Quick links sidebar

2. **All Pages Work**
   - Repositories
   - Projects  
   - Organizations
   - Agents
   - Settings

3. **No Console Errors**
   - Check browser console (F12)
   - Should see no red errors

## 🎯 Testing Without Backend

The dashboard works fine without the backend API:
- ✅ UI/UX can be tested
- ✅ Forms work
- ✅ Modals work
- ✅ Navigation works
- ⚠️ Data will be empty (shows empty states)

## 📞 Still Need Help?

1. Check `DEBUG.md` for detailed debugging
2. Check `TESTING_GUIDE.md` for full testing guide
3. Run `./scripts/test.sh` to check for issues

---

**The mock auth token will persist until you clear browser data!**
