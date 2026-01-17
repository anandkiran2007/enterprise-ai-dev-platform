"""
Project schemas
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    repository_count: Optional[int] = None
    last_activity: Optional[datetime] = None
    created_at: datetime


class ProjectDashboardResponse(BaseModel):
    summary: Dict[str, Any]
    recent_activity: List[Dict[str, Any]]
    agent_performance: Dict[str, Any]
    repository_health: List[Dict[str, Any]]
