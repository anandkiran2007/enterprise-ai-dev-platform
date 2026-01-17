"""
Organization management service
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from services.api.schemas.organizations import (
    OrganizationCreate, OrganizationResponse, OrganizationMemberResponse
)


_orgs_by_user: Dict[str, List[OrganizationResponse]] = {}
_org_members: Dict[str, List[OrganizationMemberResponse]] = {}
_org_lock = asyncio.Lock()


class OrganizationService:
    """Organization management service"""
    
    async def get_user_organizations(self, user_id: str, db) -> List[OrganizationResponse]:
        """Get user's organizations"""
        async with _org_lock:
            return list(_orgs_by_user.get(user_id, []))
    
    async def create_organization(self, org_data: OrganizationCreate, user_id: str, db) -> OrganizationResponse:
        """Create new organization"""
        org = OrganizationResponse(
            id=str(uuid.uuid4()),
            name=org_data.name,
            slug=org_data.slug,
            created_at=datetime.utcnow(),
            member_count=1
        )

        # Add creator as admin
        admin_member = OrganizationMemberResponse(
            id=str(uuid.uuid4()),
            username=f"user_{user_id[:8]}",
            email=f"user_{user_id[:8]}@example.com",
            role="admin",
            joined_at=datetime.utcnow()
        )

        async with _org_lock:
            # Add org to user's orgs
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
            
            # Set up members
            _org_members[org.id] = [admin_member]

        return org

    async def get_members(self, org_id: str, db) -> List[OrganizationMemberResponse]:
        """Get organization members"""
        async with _org_lock:
            return list(_org_members.get(org_id, []))
    
    async def is_member(self, org_id: str, user_id: str, db) -> bool:
        """Check if user is member of organization"""
        async with _org_lock:
            members = _org_members.get(org_id, [])
            return any(member.id.endswith(user_id[:8]) for member in members)
    
    async def is_admin_or_maintainer(self, org_id: str, user_id: str, db) -> bool:
        """Check if user is admin or maintainer"""
        async with _org_lock:
            members = _org_members.get(org_id, [])
            return any(
                member.id.endswith(user_id[:8]) and member.role in ["admin", "maintainer"]
                for member in members
            )
    
    async def invite_member(self, org_id: str, email: str, role: str, db) -> OrganizationMemberResponse:
        """Invite member to organization"""
        member = OrganizationMemberResponse(
            id=str(uuid.uuid4()),
            username=email.split("@")[0],
            email=email,
            role=role,
            joined_at=datetime.utcnow()
        )

        async with _org_lock:
            org_members = _org_members.setdefault(org_id, [])
            org_members.append(member)

        return member
    
    async def remove_member(self, org_id: str, member_id: str, db):
        """Remove member from organization"""
        async with _org_lock:
            org_members = _org_members.get(org_id, [])
            if org_members:
                _org_members[org_id] = [
                    member for member in org_members 
                    if member.id != member_id
                ]
