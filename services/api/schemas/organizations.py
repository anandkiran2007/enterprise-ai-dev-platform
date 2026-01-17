"""
Organization schemas
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class OrganizationCreate(BaseModel):
    name: str
    slug: str


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    created_at: datetime
    member_count: Optional[int] = None


class OrganizationMemberResponse(BaseModel):
    id: str
    user: Dict[str, Any]  # Changed to Dict to avoid circular import
    role: str
    created_at: datetime
