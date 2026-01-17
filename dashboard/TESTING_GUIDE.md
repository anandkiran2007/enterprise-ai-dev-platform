# 🧪 Testing Guide

Complete guide for testing the Enterprise AI Development Platform dashboard.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Running the Application](#running-the-application)
4. [Testing Each Page](#testing-each-page)
5. [Testing BFF Layer](#testing-bff-layer)
6. [API Integration Testing](#api-integration-testing)
7. [Browser Testing](#browser-testing)
8. [Troubleshooting](#troubleshooting)

## ✅ Prerequisites

### Required Software
- **Node.js** 16+ and npm
- **Python** 3.9+ (for backend API)
- **PostgreSQL** 14+ (optional, for full backend)
- **Redis** 6+ (optional, for full backend)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Optional
- Docker & Docker Compose (for full stack)
- Postman or Insomnia (for API testing)

## 🛠️ Setup

### 1. Install Dependencies

```bash
# Navigate to dashboard directory
cd dashboard

# Install Node.js dependencies
npm install

# Verify installation
npm run type-check
npm run lint
```

### 2. Environment Configuration

Create `.env.local` in the `dashboard` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: For development
NEXT_PUBLIC_ENVIRONMENT=development
```

### 3. Start Backend API (Optional)

If you want to test with a real backend:

```bash
# From project root
cd ..

# Start backend services
docker-compose up -d postgres redis

# Start API server
source venv/bin/activate
cd services/api
uvicorn main:app --reload --port 8000
```

## 🚀 Running the Application

### Development Mode

```bash
# From dashboard directory
cd dashboard

# Start Next.js development server
npm run dev
```

The dashboard will be available at:
- **Frontend**: http://localhost:3000
- **Backend API** (if running): http://localhost:8000

### Production Build Test

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🧪 Testing Each Page

### 1. Landing Page (`/`)

**Test Steps:**
1. ✅ Navigate to http://localhost:3000
2. ✅ Verify modern gradient design loads
3. ✅ Check "Sign in with GitHub" button is visible
4. ✅ Click button and verify redirect (or error if API not running)
5. ✅ Test responsive design (resize browser)
6. ✅ Verify dark mode toggle works (if implemented)

**Expected Results:**
- Page loads without errors
- All features are visible
- Button is clickable
- Responsive on mobile/tablet/desktop

### 2. Dashboard (`/dashboard`)

**Test Steps:**
1. ✅ Navigate to `/dashboard` (may redirect to `/` if not authenticated)
2. ✅ Verify metrics cards load (may show 0 if no data)
3. ✅ Check activity feed section
4. ✅ Verify quick links are clickable
5. ✅ Test loading states (skeleton loaders)
6. ✅ Test error states (disconnect API)
7. ✅ Verify dark mode support

**Expected Results:**
- Metrics display correctly
- Activity feed shows data or empty state
- Quick links navigate correctly
- Loading states show skeletons
- Error states show friendly messages

### 3. Repositories (`/repositories`)

**Test Steps:**
1. ✅ Navigate to `/repositories`
2. ✅ Verify search bar works
3. ✅ Test organization filter dropdown
4. ✅ Test project filter dropdown
5. ✅ Click "Add Repository" button
6. ✅ Fill out repository form:
   - Name: `test-repo`
   - Full Name: `owner/test-repo`
   - Branch: `main`
7. ✅ Submit form and verify toast notification
8. ✅ Verify repository appears in table
9. ✅ Test sync button (if API connected)
10. ✅ Test discovery button
11. ✅ Test discovery modal opens
12. ✅ Verify empty state when no repositories

**Expected Results:**
- Filters work correctly
- Form validation prevents invalid submissions
- Toast notifications appear
- Modals open/close smoothly
- Table displays data correctly

### 4. Projects (`/projects`)

**Test Steps:**
1. ✅ Navigate to `/projects`
2. ✅ Verify organization selector loads
3. ✅ Create new organization:
   - Name: `Test Org`
   - Slug: `test-org`
4. ✅ Verify organization appears in list
5. ✅ Select organization
6. ✅ Create new project:
   - Name: `Test Project`
   - Description: `Test description`
7. ✅ Verify project appears in table
8. ✅ Test project status badges
9. ✅ Verify empty states

**Expected Results:**
- Organization creation works
- Project creation works
- List updates dynamically
- Status badges display correctly

### 5. Organizations (`/organizations`)

**Test Steps:**
1. ✅ Navigate to `/organizations`
2. ✅ Verify organization list loads
3. ✅ Select an organization
4. ✅ Verify members list loads
5. ✅ Click "Invite Member"
6. ✅ Fill invite form:
   - Email: `test@example.com`
   - Role: `member`
7. ✅ Submit and verify toast
8. ✅ Verify member appears in list
9. ✅ Test remove member button
10. ✅ Verify role badges display correctly

**Expected Results:**
- Organization selection works
- Member invitation works
- Member removal works
- Role badges display correctly

### 6. Agents (`/agents`)

**Test Steps:**
1. ✅ Navigate to `/agents`
2. ✅ Verify agent list loads (may be empty)
3. ✅ Click "Create Agent"
4. ✅ Fill agent form:
   - Name: `Test Agent`
   - Type: `code_analyzer`
5. ✅ Submit and verify agent appears
6. ✅ Select an agent
7. ✅ Verify agent details load
8. ✅ Test Start/Stop buttons
9. ✅ Verify tasks list loads
10. ✅ Click on a task to view details
11. ✅ Verify real-time updates (if API connected)

**Expected Results:**
- Agent creation works
- Agent details display correctly
- Start/Stop actions work
- Tasks list updates
- Real-time polling works

### 7. Settings (`/settings`)

**Test Steps:**
1. ✅ Navigate to `/settings`
2. ✅ Test tab navigation (Profile, Integrations, Environment)
3. ✅ **Profile Tab:**
   - Change theme (Light/Dark/System)
   - Toggle notifications
   - Change language
   - Change timezone
   - Click "Save Profile Settings"
4. ✅ **Integrations Tab:**
   - Test GitHub connect button
   - Test Slack connect modal
   - Enter webhook URL
   - Test Discord connect modal
5. ✅ **Environment Tab:**
   - Change environment setting
   - Update API URL
   - Save settings

**Expected Results:**
- Tabs switch correctly
- Forms save successfully
- Toast notifications appear
- Modals open/close correctly

## 🔄 Testing BFF Layer

### Test BFF Service Directly

Create a test file `dashboard/test-bff.ts`:

```typescript
import { bffService } from './src/services/bff.service'

async function testBFF() {
  try {
    // Test dashboard data aggregation
    const dashboardData = await bffService.getDashboardData()
    console.log('Dashboard Data:', dashboardData)
    
    // Test project dashboard
    const projectData = await bffService.getProjectDashboard('test-project-id')
    console.log('Project Data:', projectData)
    
    // Test organization dashboard
    const orgData = await bffService.getOrganizationDashboard('test-org-id')
    console.log('Organization Data:', orgData)
    
    // Test cache
    bffService.clearCache()
    console.log('Cache cleared')
  } catch (error) {
    console.error('BFF Test Error:', error)
  }
}

testBFF()
```

### Test Caching

```typescript
// First call - should fetch from API
const data1 = await bffService.getDashboardData()
console.log('First call timestamp:', Date.now())

// Second call within 30 seconds - should use cache
const data2 = await bffService.getDashboardData()
console.log('Second call timestamp:', Date.now())

// Clear cache
bffService.clearCache()

// Third call - should fetch from API again
const data3 = await bffService.getDashboardData()
console.log('Third call timestamp:', Date.now())
```

## 🔌 API Integration Testing

### Test API Endpoints

Using curl or Postman:

```bash
# Health check
curl http://localhost:8000/health

# Get organizations (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/organizations

# Get repositories
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/repositories

# Get agents
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/agents
```

### Test with Mock Data

If API is not available, the frontend should handle errors gracefully:
1. ✅ Verify error messages display
2. ✅ Check retry logic works
3. ✅ Verify empty states show
4. ✅ Check loading states

## 🌐 Browser Testing

### Test in Multiple Browsers

- ✅ **Chrome** (latest)
- ✅ **Firefox** (latest)
- ✅ **Safari** (latest)
- ✅ **Edge** (latest)

### Test Responsive Design

1. ✅ **Mobile** (375px - 767px)
   - Sidebar should collapse
   - Tables should scroll horizontally
   - Modals should be full-width

2. ✅ **Tablet** (768px - 1023px)
   - 2-column layouts
   - Sidebar may be collapsible

3. ✅ **Desktop** (1024px+)
   - Full 3-column layout
   - Sidebar always visible

### Test Dark Mode

1. ✅ Toggle dark mode in settings
2. ✅ Verify all pages support dark mode
3. ✅ Check contrast ratios
4. ✅ Verify icons are visible

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to API"

**Solution:**
```bash
# Check if API is running
curl http://localhost:8000/health

# Start API if not running
cd services/api
uvicorn main:app --reload --port 8000
```

#### 2. "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
cd dashboard
rm -rf node_modules package-lock.json
npm install
```

#### 3. TypeScript errors

**Solution:**
```bash
# Check for type errors
npm run type-check

# Fix linting issues
npm run lint -- --fix
```

#### 4. Build fails

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

#### 5. Port already in use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or use different port
PORT=3001 npm run dev
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
DEBUG=* npm run dev

# Or in browser console
localStorage.setItem('debug', '*')
```

## ✅ Testing Checklist

### Functionality
- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] Forms validate input
- [ ] Modals open/close correctly
- [ ] Toast notifications appear
- [ ] Loading states show
- [ ] Error states handle gracefully
- [ ] Empty states display correctly

### UI/UX
- [ ] Responsive on all screen sizes
- [ ] Dark mode works everywhere
- [ ] Animations are smooth
- [ ] Colors have good contrast
- [ ] Icons are visible
- [ ] Text is readable

### Performance
- [ ] Pages load quickly
- [ ] Images are optimized
- [ ] No console errors
- [ ] No memory leaks
- [ ] Caching works correctly

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Focus management correct

### Integration
- [ ] API calls work (if backend running)
- [ ] Error handling works
- [ ] Retry logic works
- [ ] BFF layer aggregates correctly

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Environment
- Node.js: v[version]
- Browser: [browser] v[version]
- API: [running/not running]

### Pages Tested
- [x] Landing Page
- [x] Dashboard
- [x] Repositories
- [x] Projects
- [x] Organizations
- [x] Agents
- [x] Settings

### Issues Found
1. [Issue description]
   - Severity: [High/Medium/Low]
   - Status: [Fixed/Open]

### Notes
[Any additional notes]
```

## 🎯 Next Steps

After testing:
1. Fix any issues found
2. Run type checking: `npm run type-check`
3. Run linting: `npm run lint`
4. Build for production: `npm run build`
5. Test production build: `npm start`

---

**Happy Testing! 🚀**
