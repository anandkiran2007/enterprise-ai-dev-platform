"""
Authentication routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from typing import Optional

from services.api.schemas.auth import (
    GitHubAuthRequest, 
    GitHubAuthResponse,
    UserResponse,
    TokenResponse
)
from services.api.services.auth import AuthService
from services.api.database import get_db
from services.api.config import settings

router = APIRouter()
security = HTTPBearer()
auth_service = AuthService()


@router.post("/github", response_model=GitHubAuthResponse)
async def github_auth(
    request: GitHubAuthRequest,
    db=Depends(get_db)
):
    """Authenticate with GitHub OAuth"""
    try:
        result = await auth_service.authenticate_github(
            code=request.code,
            redirect_uri=request.redirect_uri,
            db=db
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"GitHub authentication failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str = Depends(security),
    db=Depends(get_db)
):
    """Get current user information"""
    try:
        user = await auth_service.get_current_user(token.credentials, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token: str = Depends(security),
    db=Depends(get_db)
):
    """Refresh access token"""
    try:
        result = await auth_service.refresh_token(token.credentials, db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}"
        )
