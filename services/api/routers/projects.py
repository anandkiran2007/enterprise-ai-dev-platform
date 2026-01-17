"""
Project management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from services.api.schemas.projects import (
    ProjectCreate,
    ProjectResponse,
    ProjectDashboardResponse
)
from services.api.services.projects import ProjectService
from services.api.database import get_db
from services.api.routers.auth import get_current_user

router = APIRouter()
project_service = ProjectService()


@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    org_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get projects for organization"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        projects = await project_service.get_organization_projects(
            org_id=org_id,
            user_id=user_id,
            db=db
        )
        return projects
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )


@router.post("/", response_model=ProjectResponse)
async def create_project(
    org_id: str,
    project_data: ProjectCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create new project"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        project = await project_service.create_project(
            org_id=org_id,
            project_data=project_data,
            user_id=user_id,
            db=db
        )
        return project
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create project: {str(e)}"
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get project details"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        project = await project_service.get_project(
            project_id=project_id,
            user_id=user_id,
            db=db
        )
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project: {str(e)}"
        )


@router.get("/{project_id}/dashboard", response_model=ProjectDashboardResponse)
async def get_project_dashboard(
    project_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get project dashboard with analytics"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        dashboard = await project_service.get_project_dashboard(
            project_id=project_id,
            user_id=user_id,
            db=db
        )
        return dashboard
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard: {str(e)}"
        )
