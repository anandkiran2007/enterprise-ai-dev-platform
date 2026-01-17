"""
Feature request and execution plan routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from services.api.schemas.features import (
    FeatureCreate,
    FeatureResponse,
    ExecutionPlanResponse,
    PlanApprovalRequest
)
from services.api.services.features import FeatureService
from services.api.database import get_db
from services.api.routers.auth import get_current_user

router = APIRouter()
feature_service = FeatureService()


@router.get("/", response_model=List[FeatureResponse])
async def get_features(
    project_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get feature requests for project"""
    try:
        features = await feature_service.get_project_features(
            project_id=project_id,
            user_id=current_user.id,
            db=db
        )
        return features
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch features: {str(e)}"
        )


@router.post("/", response_model=FeatureResponse)
async def create_feature(
    project_id: str,
    feature_data: FeatureCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create new feature request"""
    try:
        feature = await feature_service.create_feature(
            project_id=project_id,
            feature_data=feature_data,
            requester_id=current_user.id,
            db=db
        )
        return feature
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create feature: {str(e)}"
        )


@router.get("/{feature_id}", response_model=FeatureResponse)
async def get_feature(
    feature_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get feature details"""
    try:
        feature = await feature_service.get_feature(
            feature_id=feature_id,
            user_id=current_user.id,
            db=db
        )
        if not feature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feature not found"
            )
        return feature
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch feature: {str(e)}"
        )


@router.get("/{feature_id}/plan", response_model=ExecutionPlanResponse)
async def get_execution_plan(
    feature_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get execution plan for feature"""
    try:
        plan = await feature_service.get_execution_plan(
            feature_id=feature_id,
            user_id=current_user.id,
            db=db
        )
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Execution plan not found"
            )
        return plan
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch execution plan: {str(e)}"
        )


@router.post("/{feature_id}/plan/approve")
async def approve_execution_plan(
    feature_id: str,
    approval: PlanApprovalRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Approve or reject execution plan"""
    try:
        result = await feature_service.approve_execution_plan(
            feature_id=feature_id,
            approved=approval.approved,
            notes=approval.notes,
            user_id=current_user.id,
            db=db
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process approval: {str(e)}"
        )
