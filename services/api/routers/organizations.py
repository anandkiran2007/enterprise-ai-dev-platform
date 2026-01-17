"""
Organization management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from services.api.schemas.organizations import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationMemberResponse
)
from services.api.services.organizations import OrganizationService
from services.api.database import get_db
from services.api.routers.auth import get_current_user

router = APIRouter()
org_service = OrganizationService()


@router.get("/", response_model=List[OrganizationResponse])
async def get_organizations(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get user's organizations"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        orgs = await org_service.get_user_organizations(user_id, db)
        return orgs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch organizations: {str(e)}"
        )


@router.post("/", response_model=OrganizationResponse)
async def create_organization(
    org_data: OrganizationCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create new organization"""
    try:
        org = await org_service.create_organization(
            org_data=org_data,
            user_id=(current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)),
            db=db
        )
        return org
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create organization: {str(e)}"
        )


@router.get("/{org_id}/members", response_model=List[OrganizationMemberResponse])
async def get_organization_members(
    org_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get organization members"""
    try:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not user_id:
            raise Exception("Invalid user context")
        # Check if user is member
        if not await org_service.is_member(org_id, user_id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this organization"
            )
        
        members = await org_service.get_members(org_id, db)
        return members
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch members: {str(e)}"
        )
