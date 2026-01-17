"""
Coding Tool Integration Routes
APIs for VS Code, Cursor, and other development tools
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict, Any
from pydantic import BaseModel

from services.agents.repository_sync import CodingToolIntegration
from services.agents.worker import AgentWorker
from services.api.database import get_db
from services.api.routers.auth import get_current_user
import aioredis
from services.api.config import settings

router = APIRouter()


class WorkspaceAnalysisRequest(BaseModel):
    workspace_path: str
    include_git_repos: bool = True
    include_dependencies: bool = True


class WorkspaceAnalysisResponse(BaseModel):
    workspace_info: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    integration_status: str


class FeatureRequestFromCodeRequest(BaseModel):
    workspace_path: str
    selected_files: List[str]
    feature_description: str
    priority: str = "medium"


class CodeContextRequest(BaseModel):
    workspace_path: str
    file_paths: List[str]
    context_type: str = "current"  # current, related, similar


class CodeContextResponse(BaseModel):
    context: Dict[str, str]
    related_files: List[str]
    suggestions: List[str]


@router.post("/workspace/analyze", response_model=WorkspaceAnalysisResponse)
async def analyze_workspace(
    request: WorkspaceAnalysisRequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Analyze coding tool workspace and provide recommendations"""
    try:
        # Extract workspace information
        workspace_info = CodingToolIntegration.get_workspace_info(request.workspace_path)
        
        # Generate recommendations
        recommendations = await _generate_workspace_recommendations(workspace_info)
        
        # Trigger async analysis if requested
        if request.include_git_repos:
            background_tasks.add_task(
                _trigger_workspace_analysis,
                current_user.id,
                request.workspace_path,
                workspace_info
            )
        
        return WorkspaceAnalysisResponse(
            workspace_info=workspace_info,
            recommendations=recommendations,
            integration_status="connected"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workspace analysis failed: {str(e)}"
        )


@router.post("/workspace/feature-request", response_model=Dict[str, Any])
async def create_feature_from_code(
    request: FeatureRequestFromCodeRequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create feature request from selected code context"""
    try:
        # Analyze selected files
        file_context = CodingToolIntegration.extract_code_context(request.selected_files)
        
        # Create feature request with enhanced context
        feature_data = {
            "title": f"Feature from {request.workspace_path}",
            "description": f"{request.feature_description}\n\n**Context:**\nSelected files: {', '.join(request.selected_files)}\nFile types: {list(file_context.keys())}",
            "priority": request.priority,
            "source": "coding_tool",
            "workspace_path": request.workspace_path,
            "selected_files": request.selected_files
        }
        
        # TODO: Save to database
        feature_id = f"feature_{int(time.time())}"
        
        # Trigger planning
        background_tasks.add_task(
            _trigger_feature_planning,
            current_user.id,
            feature_id,
            feature_data
        )
        
        return {
            "feature_id": feature_id,
            "status": "created",
            "message": "Feature request created and planning started",
            "next_steps": ["wait_for_plan", "review_plan", "approve_implementation"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feature creation failed: {str(e)}"
        )


@router.post("/code/context", response_model=CodeContextResponse)
async def get_code_context(
    request: CodeContextRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get code context for AI assistance"""
    try:
        # Extract context for requested files
        context = CodingToolIntegration.extract_code_context(request.file_paths)
        
        # Find related files based on imports and dependencies
        related_files = await _find_related_files(request.file_paths, request.workspace_path)
        
        # Generate AI suggestions
        suggestions = await _generate_code_suggestions(context, request.context_type)
        
        return CodeContextResponse(
            context=context,
            related_files=related_files,
            suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Context extraction failed: {str(e)}"
        )


@router.get("/workspace/status")
async def get_integration_status(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get integration status and active workspaces"""
    try:
        # TODO: Get from database
        return {
            "status": "connected",
            "active_workspaces": [],
            "last_sync": None,
            "agent_status": "ready"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status check failed: {str(e)}"
        )


@router.post("/workspace/sync")
async def sync_workspace(
    workspace_path: str,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Trigger workspace synchronization"""
    try:
        # Trigger sync in background
        background_tasks.add_task(
            _trigger_workspace_sync,
            current_user.id,
            workspace_path
        )
        
        return {
            "message": "Workspace sync started",
            "workspace_path": workspace_path,
            "status": "syncing"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {str(e)}"
        )


@router.get("/agents/status")
async def get_agent_status(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get status of all agents"""
    try:
        redis = aioredis.from_url(settings.redis_url)
        
        # Get agent worker statuses
        agent_statuses = []
        for agent_type in ["sync-workers", "discovery-workers", "planner-workers", "integration-workers"]:
            try:
                # Get consumer group info
                info = await redis.xinfo_groups("repository-events")  # This is a simplified approach
                agent_statuses.append({
                    "agent_type": agent_type,
                    "status": "active",
                    "consumers": 1
                })
            except Exception:
                agent_statuses.append({
                    "agent_type": agent_type,
                    "status": "inactive",
                    "consumers": 0
                })
        
        await redis.close()
        
        return {
            "agents": agent_statuses,
            "overall_status": "operational"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent status check failed: {str(e)}"
        )


# Helper functions
async def _generate_workspace_recommendations(workspace_info: Dict) -> List[Dict[str, Any]]:
    """Generate recommendations based on workspace analysis"""
    recommendations = []
    
    # Language-specific recommendations
    languages = workspace_info.get('language_distribution', {})
    
    if 'javascript' in languages or 'typescript' in languages:
        recommendations.append({
            "type": "framework",
            "title": "React/Vue Integration",
            "description": "Detected frontend framework. Consider component library integration.",
            "priority": "medium"
        })
    
    if 'python' in languages:
        recommendations.append({
            "type": "testing",
            "title": "Python Testing Setup",
            "description": "Add pytest configuration and improve test coverage.",
            "priority": "high"
        })
    
    # Repository recommendations
    repos = workspace_info.get('git_repos', [])
    if len(repos) > 1:
        recommendations.append({
            "type": "multi_repo",
            "title": "Multi-Repo Project Detected",
            "description": f"Found {len(repos)} repositories. Enable cross-repo analysis.",
            "priority": "high"
        })
    
    # Structure recommendations
    if not any('test' in repo.get('path', '').lower() for repo in repos):
        recommendations.append({
            "type": "testing",
            "title": "Add Test Structure",
            "description": "No test directories found. Consider adding test structure.",
            "priority": "medium"
        })
    
    return recommendations


async def _trigger_workspace_analysis(user_id: str, workspace_path: str, workspace_info: Dict):
    """Trigger workspace analysis in background"""
    try:
        redis = aioredis.from_url(settings.redis_url)
        
        # Publish workspace analysis event
        await redis.xadd('coding-tool-events', {
            'type': 'workspace.analyze',
            'data': {
                'user_id': user_id,
                'workspace_path': workspace_path,
                'analysis': workspace_info
            }
        })
        
        await redis.close()
        
    except Exception as e:
        print(f"Failed to trigger workspace analysis: {e}")


async def _trigger_feature_planning(user_id: str, feature_id: str, feature_data: Dict):
    """Trigger feature planning in background"""
    try:
        redis = aioredis.from_url(settings.redis_url)
        
        # Publish feature request event
        await redis.xadd('feature-events', {
            'type': 'feature.request.created',
            'data': {
                'user_id': user_id,
                'feature_id': feature_id,
                'feature_data': feature_data
            }
        })
        
        await redis.close()
        
    except Exception as e:
        print(f"Failed to trigger feature planning: {e}")


async def _trigger_workspace_sync(user_id: str, workspace_path: str):
    """Trigger workspace sync in background"""
    try:
        redis = aioredis.from_url(settings.redis_url)
        
        # Publish sync event
        await redis.xadd('coding-tool-events', {
            'type': 'workspace.sync',
            'data': {
                'user_id': user_id,
                'workspace_path': workspace_path
            }
        })
        
        await redis.close()
        
    except Exception as e:
        print(f"Failed to trigger workspace sync: {e}")


async def _find_related_files(file_paths: List[str], workspace_path: str) -> List[str]:
    """Find files related to the requested files"""
    related_files = []
    
    # Simple heuristic: files in same directories
    for file_path in file_paths:
        directory = str(Path(file_path).parent)
        
        # Look for other files in the same directory
        workspace = Path(workspace_path)
        try:
            for item in workspace.rglob(f"{directory}/*"):
                if item.is_file() and str(item) not in file_paths:
                    related_files.append(str(item))
        except Exception:
            pass
    
    return list(set(related_files))[:20]  # Limit results


async def _generate_code_suggestions(context: Dict[str, str], context_type: str) -> List[str]:
    """Generate AI-powered code suggestions"""
    suggestions = []
    
    if context_type == "current":
        suggestions.extend([
            "Analyze current code patterns",
            "Check for similar implementations",
            "Review test coverage"
        ])
    elif context_type == "related":
        suggestions.extend([
            "Consider dependency injection",
            "Look for shared utilities",
            "Check API consistency"
        ])
    elif context_type == "similar":
        suggestions.extend([
            "Extract common patterns",
            "Create reusable components",
            "Standardize interfaces"
        ])
    
    return suggestions


# Import time for timestamps
import time
from pathlib import Path
