# 🐛 Debug Guide - Blank Dashboard Issue

If you're seeing a blank or minimal dashboard page, follow these steps:

## Quick Fix

### 1. Check Browser Console

Open browser DevTools (F12) and check for errors:

```javascript
// Look for:
- Red error messages
- Failed network requests
- React errors
```

### 2. Mock Authentication (For Development)

If you don't have the backend running, you can mock authentication:

**Option A: Set localStorage manually**

Open browser console (F12) and run:

```javascript
// Mock authentication
localStorage.setItem('auth_token', 'dev-token-12345')
localStorage.setItem('auth_user', JSON.stringify({
  id: 'dev-user-1',
  email: 'dev@example.com',
  name: 'Dev User',
  username: 'devuser',
  github_id: '12345'
}))

// Refresh page
window.location.reload()
```

**Option B: Temporarily disable auth check**

Edit `dashboard/src/components/DashboardLayout.tsx` and comment out the redirect:

```typescript
useEffect(() => {
  // Temporarily disabled for development
  // const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  // if (!state.token && !storedToken) {
  //   router.replace('/')
  // }
}, [state.token, router])
```

### 3. Check API Connection

If you see network errors, the API might not be running:

```bash
# Check if API is running
curl http://localhost:8000/health

# If not running, start it:
cd services/api
uvicorn main:app --reload --port 8000
```

### 4. Verify Environment Variables

Create `dashboard/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Clear Cache and Rebuild

```bash
cd dashboard

# Clear Next.js cache
rm -rf .next

# Clear node modules (if needed)
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
npm run dev
```

## Common Issues

### Issue: "Cannot read property of undefined"

**Solution:** Check if BFF service is returning data correctly. The dashboard should handle empty data gracefully.

### Issue: "Network request failed"

**Solution:** 
- API is not running
- CORS issues
- Wrong API URL

### Issue: Blank white page

**Solution:**
1. Check browser console for React errors
2. Verify all components are imported correctly
3. Check if CSS is loading

### Issue: Authentication redirect loop

**Solution:**
- Set mock auth token (see above)
- Or disable auth check temporarily

## Step-by-Step Debugging

1. **Open Browser DevTools** (F12)
2. **Check Console Tab** - Look for errors
3. **Check Network Tab** - See if API calls are failing
4. **Check Application Tab** - Verify localStorage has auth token
5. **Check React DevTools** - If installed, check component tree

## Expected Console Output

When working correctly, you should see:
- No red errors
- API calls to `/api/organizations`, `/api/repositories` (if API running)
- React components rendering

## Still Not Working?

1. Check `TESTING_GUIDE.md` for full testing instructions
2. Run `./scripts/test.sh` to check for issues
3. Verify Node.js version: `node -v` (should be 16+)
4. Check if port 3000 is available

## Quick Test

Run this in browser console to verify everything:

```javascript
// Check if React is loaded
console.log('React:', typeof React !== 'undefined')

// Check if auth token exists
console.log('Auth Token:', localStorage.getItem('auth_token'))

// Check if user data exists
console.log('User Data:', localStorage.getItem('auth_user'))

// Check API URL
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```
