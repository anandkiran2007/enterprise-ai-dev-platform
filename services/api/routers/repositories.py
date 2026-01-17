"""
Repository management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from services.api.schemas.repositories import (
    RepositoryCreate,
    RepositoryResponse,
    RepositorySyncRequest,
    DiscoveryResponse
)
from services.api.services.repositories import RepositoryService
from services.api.database import get_db
from services.api.routers.auth import get_current_user

router = APIRouter()
repo_service = RepositoryService()


@router.get("/", response_model=List[RepositoryResponse])
async def get_repositories(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    organization_id: Optional[str] = Query(None, description="Filter by organization ID"),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get repositories - optionally filtered by project or organization"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        
        if project_id:
            repos = await repo_service.get_project_repositories(
                project_id=project_id,
                user_id=user_id,
                db=db
            )
        else:
            # Get all repositories for user (across all projects)
            repos = await repo_service.get_user_repositories(
                user_id=user_id,
                organization_id=organization_id,
                db=db
            )
        return repos
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repositories: {str(e)}"
        )


@router.post("/", response_model=RepositoryResponse)
async def connect_repository(
    project_id: str,
    repo_data: RepositoryCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Connect new repository to project"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        repo = await repo_service.connect_repository(
            project_id=project_id,
            repo_data=repo_data,
            user_id=user_id,
            db=db
        )
        return repo
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect repository: {str(e)}"
        )


@router.post("/{repo_id}/sync")
async def sync_repository(
    repo_id: str,
    sync_request: RepositorySyncRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Trigger repository sync"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        await repo_service.sync_repository(
            repo_id=repo_id,
            sync_type=sync_request.sync_type,
            user_id=user_id,
            db=db
        )
        return {"message": "Sync started", "repository_id": repo_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start sync: {str(e)}"
        )


@router.get("/{repo_id}/discovery", response_model=DiscoveryResponse)
async def get_discovery_report(
    repo_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get repository discovery report"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        discovery = await repo_service.get_discovery_report(
            repo_id=repo_id,
            user_id=user_id,
            db=db
        )
        if not discovery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Discovery report not found"
            )
        return discovery
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch discovery report: {str(e)}"
        )
