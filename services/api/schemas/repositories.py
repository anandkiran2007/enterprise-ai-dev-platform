"""
Repository schemas
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class RepositoryCreate(BaseModel):
    full_name: str
    access_type: str  # "github_app", "pat", "ssh"
    branch: str = "main"


class RepositoryResponse(BaseModel):
    id: str
    name: str
    full_name: str
    clone_url: str
    branch: str
    sync_status: str
    last_synced_at: Optional[datetime] = None
    discovery_status: Optional[str] = None
    detected_stack: Optional[Dict[str, Any]] = None


class RepositorySyncRequest(BaseModel):
    sync_type: str = "full"  # "full" or "incremental"


class DiscoveryResponse(BaseModel):
    id: str
    detected_stack: Dict[str, Any]
    service_boundaries: list
    dependency_graph: Dict[str, Any]
    risk_hotspots: list
    file_index_summary: Dict[str, Any]
