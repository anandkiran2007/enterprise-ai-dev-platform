# API 404 Error Fix

## Issue
Frontend was getting 404 errors when calling:
- `/api/organizations?limit=10`
- `/api/repositories?limit=10`

## Root Cause

1. **Repositories Route**: The backend required `project_id` as a mandatory query parameter, but the frontend was calling it without any parameters.

2. **Trailing Slash Redirect**: FastAPI automatically redirects routes without trailing slashes to ones with trailing slashes (e.g., `/api/organizations` → `/api/organizations/`). This redirect might not be handled properly through nginx or by the frontend.

## Fixes Applied

### 1. Updated Repositories Route (`services/api/routers/repositories.py`)
- Made `project_id` **optional** using `Query(None)`
- Added `organization_id` as an optional filter
- Updated route to handle both cases:
  - With `project_id`: Returns repositories for that project
  - Without `project_id`: Returns all repositories for the user

### 2. Updated Repository Service (`services/api/services/repositories.py`)
- Added `get_user_repositories()` method to fetch all repositories across all projects
- Supports optional filtering by organization

## Changes Made

```python
# Before
@router.get("/", response_model=List[RepositoryResponse])
async def get_repositories(
    project_id: str,  # Required!
    ...
):

# After
@router.get("/", response_model=List[RepositoryResponse])
async def get_repositories(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    organization_id: Optional[str] = Query(None, description="Filter by organization ID"),
    ...
):
```

## Testing

After restarting the API service, test the endpoints:

```bash
# Test organizations (should work)
curl http://localhost:8000/api/organizations/

# Test repositories without project_id (should now work)
curl http://localhost:8000/api/repositories/

# Test repositories with project_id (still works)
curl http://localhost:8000/api/repositories/?project_id=some-id
```

## Next Steps

1. **Restart the API service**:
   ```bash
   docker-compose -f docker-compose.production.yml restart api
   ```

2. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

3. **Verify the fix**:
   - Open browser DevTools (F12)
   - Check Network tab
   - The API calls should now return 200 OK instead of 404

## Note on Trailing Slashes

FastAPI automatically handles trailing slash redirects. If you still see issues:
- The frontend should follow 307 redirects automatically
- Nginx should pass through redirects correctly
- If problems persist, consider updating frontend to always use trailing slashes

## Authentication

Note: These endpoints require authentication. If you see 403 Forbidden instead of 404, that means:
- The route is found (good!)
- But authentication is failing (check auth token in localStorage)
