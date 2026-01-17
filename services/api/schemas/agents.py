"""
Agent execution schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AgentExecutionResponse(BaseModel):
    id: str
    agent_type: str
    phase_number: int
    status: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    token_usage: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    artifacts: Optional[List[Dict[str, Any]]] = None


class AgentExecutionListResponse(BaseModel):
    executions: List[AgentExecutionResponse]
    total_count: int
