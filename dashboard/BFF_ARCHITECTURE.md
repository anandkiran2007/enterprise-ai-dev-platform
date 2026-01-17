# BFF (Backend for Frontend) Architecture

## Overview

This dashboard implements a modern BFF (Backend for Frontend) pattern to optimize data fetching, reduce API calls, and provide a better user experience.

## Architecture Components

### 1. BFF Service Layer (`services/bff.service.ts`)

The BFF service acts as an aggregation layer that:
- Combines data from multiple API endpoints
- Implements intelligent caching (30-second TTL)
- Provides optimized data structures for the frontend
- Handles parallel data fetching for better performance

**Key Methods:**
- `getDashboardData()` - Aggregates dashboard metrics, activities, organizations, projects, and repositories
- `getProjectDashboard(projectId)` - Provides comprehensive project view with all related data
- `getOrganizationDashboard(orgId)` - Aggregates organization data with projects, repositories, and members
- `batchGetRepositoryStatus()` - Efficiently fetches status for multiple repositories

### 2. Service Layer (`services/*.service.ts`)

Individual service classes for each domain:
- `repositories.service.ts` - Repository management
- `organizations.service.ts` - Organization management
- `projects.service.ts` - Project management

Each service:
- Implements singleton pattern
- Provides consistent error handling
- Uses the API client for HTTP requests
- Returns typed responses

### 3. API Client (`lib/api-client.ts`)

Centralized HTTP client with:
- Automatic authentication token injection
- Request/response interceptors
- Consistent error handling
- Type-safe API responses

## Data Flow

```
UI Component
    ↓
BFF Service (aggregates & caches)
    ↓
Domain Services (repositories, organizations, projects)
    ↓
API Client (HTTP requests)
    ↓
Backend API
```

## Caching Strategy

- **Cache TTL**: 30 seconds
- **Cache Invalidation**: Manual via `clearCache()` method
- **Cache Key Format**: `{resource}_{id}` (e.g., `dashboard_data`, `project_dashboard_123`)

## Benefits

1. **Reduced API Calls**: Multiple endpoints fetched in parallel
2. **Better Performance**: Caching reduces redundant requests
3. **Optimized Data Structures**: Frontend receives pre-aggregated data
4. **Type Safety**: Full TypeScript support throughout
5. **Error Handling**: Centralized error handling with user-friendly messages
6. **Scalability**: Easy to add new aggregated endpoints

## Usage Example

```typescript
import { bffService } from '../services/bff.service'

// Get comprehensive dashboard data
const dashboardData = await bffService.getDashboardData()

// Get project dashboard
const projectData = await bffService.getProjectDashboard(projectId)

// Clear cache when needed
bffService.clearCache('dashboard_data')
```

## Future Enhancements

- [ ] Add request batching for multiple resources
- [ ] Implement optimistic updates
- [ ] Add request deduplication
- [ ] Implement background refresh
- [ ] Add WebSocket support for real-time updates
