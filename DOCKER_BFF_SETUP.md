# Docker Setup with BFF Architecture

This guide explains how to run the entire application stack using Docker, with the frontend using the BFF (Backend for Frontend) layer to communicate with the backend API.

## Architecture Overview

```
Browser
  ↓
Nginx (Port 80)
  ├─→ /api/* → Backend API (Port 8000)
  └─→ /* → Dashboard (Port 3000)
       ↓
    BFF Service Layer
       ↓
    Domain Services (organizations, repositories, projects, agents)
       ↓
    API Client (uses relative paths /api/*)
       ↓
    Backend API
```

## Key Components

### 1. BFF (Backend for Frontend) Service
- **Location**: `dashboard/src/services/bff.service.ts`
- **Purpose**: Aggregates data from multiple API endpoints, implements caching, and optimizes data fetching
- **Used by**: Dashboard page for aggregated metrics and activity

### 2. API Client
- **Location**: `dashboard/src/lib/api-client.ts`
- **Configuration**: Uses relative paths (`/api/*`) when `NEXT_PUBLIC_USE_RELATIVE_PATHS=true`
- **Routing**: Nginx proxies `/api/*` requests to the backend API service

### 3. Nginx Reverse Proxy
- **Location**: `docker/nginx.conf`
- **Routes**:
  - `/api/*` → Backend API service
  - `/*` → Dashboard service

## Quick Start

### 1. Start All Services

```bash
# Start all services (API, Dashboard, Database, Redis, Nginx)
docker-compose -f docker-compose.production.yml up --build
```

### 2. Access the Application

- **Dashboard**: http://localhost (via Nginx)
- **API Direct**: http://localhost:8000 (if exposed)
- **Dashboard Direct**: http://localhost:3000 (if exposed)

### 3. Environment Variables

Create a `.env` file in the project root:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## Docker Compose Services

### API Service
- **Image**: Built from `docker/Dockerfile.api`
- **Port**: 8000 (internal), exposed for direct access
- **Environment**: Database, Redis, API keys
- **Network**: `enterprise-ai-network`

### Dashboard Service
- **Image**: Built from `dashboard/Dockerfile.dev` (dev) or `dashboard/Dockerfile` (prod)
- **Port**: 3000 (internal)
- **Environment Variables**:
  - `NEXT_PUBLIC_USE_RELATIVE_PATHS=true` - Use relative paths for API calls
  - `NEXT_PUBLIC_API_URL=` - Empty (uses relative paths)
  - `API_URL=http://api:8000` - Server-side API URL (for SSR)
- **Network**: `enterprise-ai-network`

### Nginx Service
- **Image**: `nginx:alpine`
- **Port**: 80 (HTTP), 443 (HTTPS - optional)
- **Configuration**: `docker/nginx.conf`
- **Routes**:
  - `/api/*` → `http://api:8000`
  - `/*` → `http://dashboard:3000`

### Database (PostgreSQL)
- **Image**: `postgres:15`
- **Port**: 5432
- **Database**: `enterprise_ai_dev`
- **Credentials**: `postgres/postgres`

### Redis
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Purpose**: Caching and session storage

## How BFF Works in Docker

### 1. Client-Side Requests (Browser)

When the browser makes API requests:

```typescript
// API Client detects browser context
if (typeof window !== 'undefined') {
  // Uses relative paths: /api/organizations
  // Nginx receives: /api/organizations
  // Nginx proxies to: http://api:8000/api/organizations
}
```

### 2. Server-Side Requests (SSR)

When Next.js server makes API requests:

```typescript
// Uses explicit URL: http://api:8000/api/organizations
// Direct Docker network communication
```

### 3. BFF Service Flow

```typescript
// Dashboard page calls BFF
const data = await bffService.getDashboardData()

// BFF aggregates from multiple services
const [orgs, repos, projects] = await Promise.allSettled([
  organizationsService.getOrganizations(),
  repositoriesService.getRepositories(),
  projectsService.getProjects()
])

// Each service uses API client
// API client uses relative paths in browser
// Nginx proxies to backend
```

## Development Workflow

### Option 1: Full Docker Stack (Recommended)

```bash
# Start all services
docker-compose -f docker-compose.production.yml up --build

# View logs
docker-compose -f docker-compose.production.yml logs -f dashboard
docker-compose -f docker-compose.production.yml logs -f api

# Stop services
docker-compose -f docker-compose.production.yml down
```

### Option 2: Hybrid (Dashboard Local, Backend Docker)

```bash
# Start backend services only
docker-compose up -d postgres redis api

# Run dashboard locally
cd dashboard
npm install
NEXT_PUBLIC_USE_RELATIVE_PATHS=false \
NEXT_PUBLIC_API_URL=http://localhost:8000 \
npm run dev
```

## Troubleshooting

### Issue: API calls return 404

**Solution**: Ensure API routes are prefixed with `/api/`:
- ✅ Correct: `/api/organizations`
- ❌ Wrong: `/organizations`

### Issue: `ERR_NAME_NOT_RESOLVED` for `http://api:8000`

**Solution**: This is expected in the browser. The API client should use relative paths:
- Set `NEXT_PUBLIC_USE_RELATIVE_PATHS=true`
- Set `NEXT_PUBLIC_API_URL=` (empty)

### Issue: CORS errors

**Solution**: Nginx handles routing, so CORS shouldn't be an issue. If you see CORS errors:
- Ensure you're accessing via Nginx (port 80), not directly
- Check that API client uses relative paths

### Issue: Dashboard can't connect to API

**Solution**: 
1. Check API is running: `docker-compose ps`
2. Check API logs: `docker-compose logs api`
3. Verify network: `docker network inspect enterprise-ai-dev-platform_enterprise-ai-network`
4. Test API directly: `curl http://localhost:8000/api/health`

## Production Deployment

For production:

1. Use `dashboard/Dockerfile` (production build)
2. Set up SSL certificates in `docker/ssl/`
3. Enable HTTPS in `docker/nginx.conf`
4. Use environment-specific `.env` files
5. Set up proper secrets management

## BFF Service Methods

### `getDashboardData()`
Aggregates dashboard metrics, activities, organizations, projects, and repositories.

### `getProjectDashboard(projectId)`
Fetches project with related repositories and metrics.

### `getOrganizationDashboard(orgId)`
Fetches organization with projects, repositories, and members.

### `batchGetRepositoryStatus(repositoryIds)`
Efficiently fetches status for multiple repositories.

## Benefits of BFF Pattern

1. **Reduced API Calls**: Multiple endpoints fetched in parallel
2. **Caching**: 30-second TTL reduces redundant requests
3. **Optimized Data Structures**: Data formatted for frontend needs
4. **Error Resilience**: Graceful handling of partial failures
5. **Performance**: Parallel fetching improves load times

## Network Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP
       ↓
┌─────────────┐
│    Nginx    │ Port 80
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ↓              ↓
┌─────────────┐  ┌─────────────┐
│  Dashboard  │  │  Backend API │
│  Port 3000  │  │  Port 8000  │
└─────────────┘  └─────────────┘
       │              │
       └──────┬───────┘
              │
       ┌──────┴──────┐
       │             │
       ↓             ↓
┌─────────────┐ ┌─────────────┐
│  PostgreSQL │ │    Redis   │
│  Port 5432  │ │  Port 6379 │
└─────────────┘ └─────────────┘
```

## Next Steps

1. Set up your `.env` file with API keys
2. Run `docker-compose -f docker-compose.production.yml up --build`
3. Access http://localhost
4. Check logs if issues occur
5. Review BFF service for custom aggregations
