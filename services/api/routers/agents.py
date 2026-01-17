"""
Agent execution and monitoring routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from services.api.schemas.agents import (
    AgentExecutionResponse,
    AgentExecutionListResponse
)
from services.api.services.agents import AgentService
from services.api.database import get_db
from services.api.routers.auth import get_current_user

router = APIRouter()
agent_service = AgentService()


@router.get("/executions", response_model=AgentExecutionListResponse)
async def get_agent_executions(
    plan_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get agent executions for execution plan"""
    try:
        executions = await agent_service.get_plan_executions(
            plan_id=plan_id,
            user_id=current_user.id,
            db=db
        )
        return executions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch executions: {str(e)}"
        )


@router.get("/executions/{execution_id}", response_model=AgentExecutionResponse)
async def get_agent_execution(
    execution_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get specific agent execution details"""
    try:
        execution = await agent_service.get_execution(
            execution_id=execution_id,
            user_id=current_user.id,
            db=db
        )
        if not execution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent execution not found"
            )
        return execution
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch execution: {str(e)}"
        )


@router.post("/executions/{execution_id}/retry")
async def retry_agent_execution(
    execution_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Retry failed agent execution"""
    try:
        await agent_service.retry_execution(
            execution_id=execution_id,
            user_id=current_user.id,
            db=db
        )
        return {"message": "Execution retry started", "execution_id": execution_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retry execution: {str(e)}"
        )
