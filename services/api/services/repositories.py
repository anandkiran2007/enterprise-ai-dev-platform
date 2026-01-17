"""
Repository management service
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from services.api.schemas.repositories import (
    RepositoryCreate, RepositoryResponse, RepositorySyncRequest, DiscoveryResponse
)


_repos_by_project: Dict[str, List[RepositoryResponse]] = {}
_repo_lock = asyncio.Lock()


class RepositoryService:
    """Repository management service"""
    
    async def get_project_repositories(self, project_id: str, user_id: str, db) -> List[RepositoryResponse]:
        """Get repositories for project"""
        async with _repo_lock:
            return list(_repos_by_project.get(project_id, []))
    
    async def connect_repository(self, project_id: str, repo_data: RepositoryCreate, user_id: str, db) -> RepositoryResponse:
        """Connect new repository to project"""
        repo = RepositoryResponse(
            id=str(uuid.uuid4()),
            name=repo_data.full_name.split("/")[-1],
            full_name=repo_data.full_name,
            clone_url=f"https://github.com/{repo_data.full_name}.git",
            branch=repo_data.branch,
            sync_status="pending",
            last_synced_at=None,
            discovery_status=None,
            detected_stack=None
        )

        async with _repo_lock:
            project_repos = _repos_by_project.setdefault(project_id, [])
            project_repos.append(repo)

        return repo
    
    async def sync_repository(self, repo_id: str, sync_type: str, user_id: str, db):
        """Trigger repository sync"""
        async with _repo_lock:
            for project_repos in _repos_by_project.values():
                for repo in project_repos:
                    if repo.id == repo_id:
                        repo.sync_status = "syncing"
                        repo.last_synced_at = datetime.utcnow()
                        break
    
    async def get_discovery_report(self, repo_id: str, user_id: str, db) -> Optional[DiscoveryResponse]:
        """Get repository discovery report"""
        # Mock discovery data
        return DiscoveryResponse(
            id=repo_id,
            detected_stack={
                "frontend": ["React", "TypeScript", "Tailwind CSS"],
                "backend": ["FastAPI", "PostgreSQL", "Redis"],
                "infrastructure": ["Docker", "Nginx"]
            },
            service_boundaries=[
                {"name": "api", "files": ["/api/", "/services/"]},
                {"name": "frontend", "files": ["/src/", "/components/"]}
            ],
            dependency_graph={
                "nodes": ["api", "frontend", "database"],
                "edges": [["frontend", "api"], ["api", "database"]]
            },
            risk_hotspots=[
                {"file": "/api/auth.py", "risk": "high", "reason": "Authentication logic"},
                {"file": "/src/components/Auth.tsx", "risk": "medium", "reason": "Token handling"}
            ],
            file_index_summary={
                "total_files": 150,
                "indexed_files": 145,
                "languages": {"Python": 45, "TypeScript": 35, "JavaScript": 25, "Other": 45}
            }
        )
