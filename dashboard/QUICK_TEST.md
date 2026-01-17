# ⚡ Quick Test Guide

Fast testing steps to verify the dashboard is working.

## 🚀 Quick Start (5 minutes)

### 1. Install & Start

```bash
cd dashboard
npm install
npm run dev
```

### 2. Open Browser

Navigate to: **http://localhost:3000**

### 3. Test Each Page

#### ✅ Landing Page
- [ ] Page loads
- [ ] "Sign in with GitHub" button visible
- [ ] No console errors

#### ✅ Dashboard (after login/mock)
- [ ] Metrics cards display
- [ ] Activity feed shows
- [ ] Quick links work

#### ✅ Repositories
- [ ] Page loads
- [ ] "Add Repository" button works
- [ ] Modal opens
- [ ] Form validation works

#### ✅ Projects
- [ ] Organization selector works
- [ ] Create project button works
- [ ] Modal opens

#### ✅ Organizations
- [ ] Organization list loads
- [ ] Create organization works
- [ ] Invite member works

#### ✅ Agents
- [ ] Agent list loads
- [ ] Create agent works
- [ ] Agent details display

#### ✅ Settings
- [ ] Tabs switch
- [ ] Forms save
- [ ] Modals work

## 🔍 Quick Checks

### Check for Errors
```bash
# In browser console (F12)
# Should see no red errors
```

### Check Responsive
- Resize browser window
- All pages should adapt

### Check Dark Mode
- Go to Settings
- Toggle theme
- All pages should switch

## 🐛 Quick Fixes

### Port in use?
```bash
PORT=3001 npm run dev
```

### Dependencies issue?
```bash
rm -rf node_modules package-lock.json
npm install
```

### Type errors?
```bash
npm run type-check
```

## ✅ Success Criteria

If you can:
- ✅ Navigate all pages
- ✅ Open all modals
- ✅ See no console errors
- ✅ Forms validate
- ✅ Dark mode works

**Then the dashboard is working! 🎉**
