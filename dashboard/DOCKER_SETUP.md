# 🐳 Docker Setup Guide

Complete guide for running the dashboard with Docker.

## Quick Start

### 1. Start All Services

```bash
# From project root
docker-compose -f docker-compose.production.yml up -d
```

This will start:
- ✅ API service on port 8000
- ✅ Dashboard service on port 3000
- ✅ Nginx reverse proxy on port 80
- ✅ PostgreSQL database
- ✅ Redis
- ✅ Prometheus & Grafana

### 2. Access the Dashboard

- **Dashboard**: http://localhost (via nginx)
- **Dashboard Direct**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Grafana**: http://localhost:3001

### 3. Mock Authentication

Since you're in Docker, open browser console and run:

```javascript
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

## 🔧 Configuration

### Environment Variables

The Docker setup uses these environment variables:

**Dashboard** (`docker-compose.production.yml`):
- `NEXT_PUBLIC_API_URL=http://api:8000` (for server-side)
- `API_URL=http://api:8000` (for Next.js rewrites)

**API**:
- `DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/enterprise_ai_dev`
- `REDIS_URL=redis://redis:6379`

### API Routes

All API routes are prefixed with `/api/`:
- `/api/organizations`
- `/api/projects`
- `/api/repositories`
- `/api/agents`
- `/api/auth`

## 🌐 How It Works

### Nginx Reverse Proxy

Nginx routes requests:
- `/api/*` → `http://api:8000/api/*` (API service)
- `/*` → `http://dashboard:3000/*` (Dashboard service)

### Next.js Rewrites

The dashboard also has Next.js rewrites configured:
- `/api/*` → `${API_URL}/api/*`

This allows the dashboard to proxy API requests when running standalone.

## 🧪 Testing in Docker

### 1. Check Services Are Running

```bash
docker-compose -f docker-compose.production.yml ps
```

### 2. Check Logs

```bash
# Dashboard logs
docker-compose -f docker-compose.production.yml logs dashboard

# API logs
docker-compose -f docker-compose.production.yml logs api

# All logs
docker-compose -f docker-compose.production.yml logs
```

### 3. Test API

```bash
# Health check
curl http://localhost:8000/health

# API endpoint
curl http://localhost:8000/api/organizations
```

### 4. Test Dashboard

1. Open http://localhost in browser
2. Set mock auth token (see above)
3. Navigate to `/dashboard`
4. Should see dashboard with data (or empty states if no data)

## 🔍 Troubleshooting

### Issue: "Cannot connect to API"

**Check:**
```bash
# Is API running?
docker-compose -f docker-compose.production.yml ps api

# Check API logs
docker-compose -f docker-compose.production.yml logs api

# Test API directly
curl http://localhost:8000/health
```

### Issue: "404 Not Found" on API calls

**Solution:** All API routes should use `/api/` prefix. The services have been updated to use this.

### Issue: Dashboard shows blank page

**Solution:**
1. Set mock auth token (see above)
2. Check browser console for errors
3. Verify nginx is routing correctly

### Issue: CORS errors

**Solution:** Nginx handles CORS. If you see CORS errors, check nginx configuration.

## 📝 Development vs Production

### Development (Standalone)

```bash
cd dashboard
npm run dev
```

Uses:
- `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Direct API calls from browser

### Production (Docker)

```bash
docker-compose -f docker-compose.production.yml up
```

Uses:
- Nginx reverse proxy
- Docker networking (`api:8000`)
- Next.js rewrites for server-side

## ✅ Verification Checklist

- [ ] All Docker services are running
- [ ] API responds at http://localhost:8000/health
- [ ] Dashboard loads at http://localhost
- [ ] Mock auth token is set
- [ ] No console errors
- [ ] API calls go to `/api/*` endpoints
- [ ] Data loads (or shows empty states)

---

**Your Docker setup is ready! 🎉**
