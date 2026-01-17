"""
Feature request and execution plan schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class FeatureCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"  # "high", "medium", "low"


class FeatureResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    requester: Dict[str, Any]
    execution_plan: Optional[Dict[str, Any]] = None
    agent_executions: Optional[List[Dict[str, Any]]] = None
    pull_requests: Optional[List[Dict[str, Any]]] = None
    created_at: datetime


class ExecutionPlanResponse(BaseModel):
    id: str
    feature_request_id: str
    status: str
    phases: List[Dict[str, Any]]
    blast_radius: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    test_strategy: Dict[str, Any]


class PlanApprovalRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None
