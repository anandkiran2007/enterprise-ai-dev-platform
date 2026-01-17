"""
Authentication schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class GitHubAuthRequest(BaseModel):
    code: str
    redirect_uri: str


class GitHubAuthResponse(BaseModel):
    access_token: str
    user: Dict[str, Any]  # User data as dict to avoid circular imports
    organizations: List[Dict[str, Any]]  # Organization data as dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
