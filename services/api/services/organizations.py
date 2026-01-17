"""Organization management service"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List

from services.api.schemas.organizations import OrganizationCreate, OrganizationResponse, OrganizationMemberResponse


_orgs_by_user: Dict[str, List[OrganizationResponse]] = {}
_org_lock = asyncio.Lock()


class OrganizationService:
    """Organization management service"""

    async def get_user_organizations(self, user_id: str, db) -> List[OrganizationResponse]:
        """Get organizations for user"""
        async with _org_lock:
            return list(_orgs_by_user.get(user_id, []))

    async def create_organization(self, org_data: OrganizationCreate, user_id: str, db) -> OrganizationResponse:
        """Create new organization"""
        org = OrganizationResponse(
            id=str(uuid.uuid4()),
            name=org_data.name,
            slug=org_data.slug,
            created_at=datetime.utcnow(),
            member_count=1,
        )

        async with _org_lock:
            user_orgs = _orgs_by_user.setdefault(user_id, [])
            if any(existing.slug == org.slug for existing in user_orgs):
                org = OrganizationResponse(
                    id=str(uuid.uuid4()),
                    name=org_data.name,
                    slug=f"{org_data.slug}-{str(uuid.uuid4())[:8]}",
                    created_at=datetime.utcnow(),
                    member_count=1,
                )
            user_orgs.append(org)

        return org

    async def is_member(self, org_id: str, user_id: str, db) -> bool:
        """Check if user is organization member"""
        async with _org_lock:
            return any(org.id == org_id for org in _orgs_by_user.get(user_id, []))

    async def get_members(self, org_id: str, db) -> List[OrganizationMemberResponse]:
        """Get organization members"""
        return []
