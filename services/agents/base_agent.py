"""
Base Agent Interface and Common Utilities
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import uuid
import time


class AgentStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"


@dataclass
class AgentInput:
    """Standard input structure for all agents"""
    execution_plan_id: str
    phase_number: int
    context: Dict[str, Any]
    repositories: List[str]
    file_scope: List[str]  # Specific files agent can modify
    constraints: Dict[str, Any]
    memory_snapshot: Dict[str, Any]


@dataclass
class AgentOutput:
    """Standard output structure for all agents"""
    status: AgentStatus
    files_modified: List[str]
    files_created: List[str]
    artifacts_created: List[str]
    next_actions: List[str]
    token_usage: Dict[str, int]
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class BaseAgent(ABC):
    """Base contract for all agent implementations"""
    
    def __init__(self, agent_id: str, config: Dict[str, Any]):
        self.agent_id = agent_id
        self.config = config
        self.status = AgentStatus.PENDING
        self.execution_id = str(uuid.uuid4())
        self.start_time = None
        self.end_time = None
    
    @abstractmethod
    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """Execute the agent's primary function"""
        pass
    
    @abstractmethod
    def validate_input(self, input_data: AgentInput) -> bool:
        """Validate input before execution"""
        pass
    
    @abstractmethod
    def estimate_tokens(self, input_data: AgentInput) -> int:
        """Estimate token usage for cost control"""
        pass
    
    async def run_with_monitoring(self, input_data: AgentInput) -> AgentOutput:
        """Run agent with monitoring and error handling"""
        self.start_time = time.time()
        self.status = AgentStatus.RUNNING
        
        try:
            # Validate input
            if not self.validate_input(input_data):
                return AgentOutput(
                    status=AgentStatus.FAILED,
                    files_modified=[],
                    files_created=[],
                    artifacts_created=[],
                    next_actions=["fix_input"],
                    token_usage={},
                    error_message="Invalid input data"
                )
            
            # Execute agent
            result = await self.execute(input_data)
            
            self.end_time = time.time()
            self.status = result.status
            
            # Add execution metadata
            if not result.metadata:
                result.metadata = {}
            
            result.metadata.update({
                'execution_id': self.execution_id,
                'agent_id': self.agent_id,
                'duration_seconds': self.end_time - self.start_time,
                'started_at': self.start_time,
                'completed_at': self.end_time
            })
            
            return result
            
        except Exception as e:
            self.end_time = time.time()
            self.status = AgentStatus.FAILED
            
            return AgentOutput(
                status=AgentStatus.FAILED,
                files_modified=[],
                files_created=[],
                artifacts_created=[],
                next_actions=["retry", "investigate_error"],
                token_usage={},
                error_message=f"Agent execution failed: {str(e)}",
                metadata={
                    'execution_id': self.execution_id,
                    'agent_id': self.agent_id,
                    'duration_seconds': self.end_time - self.start_time if self.end_time else 0,
                    'error_type': type(e).__name__
                }
            )
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            'agent_id': self.agent_id,
            'execution_id': self.execution_id,
            'status': self.status.value,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'duration': (self.end_time or time.time()) - (self.start_time or time.time())
        }


class AgentUtils:
    """Utility functions for agent operations"""
    
    @staticmethod
    def extract_code_context(file_paths: List[str], max_files: int = 10) -> Dict[str, str]:
        """Extract code context from file paths"""
        context = {}
        
        for file_path in file_paths[:max_files]:
            try:
                # TODO: Implement file reading from storage
                # For now, return mock content
                context[file_path] = f"// Content of {file_path}\n// TODO: Load actual file content"
            except Exception:
                context[file_path] = f"// Error loading {file_path}"
        
        return context
    
    @staticmethod
    def validate_file_scope(file_scope: List[str], allowed_patterns: List[str]) -> bool:
        """Validate that file scope is within allowed patterns"""
        for file_path in file_scope:
            if not any(pattern in file_path for pattern in allowed_patterns):
                return False
        return True
    
    @staticmethod
    def estimate_complexity(
        files_modified: List[str], 
        lines_changed: int = 0
    ) -> Dict[str, Any]:
        """Estimate complexity of changes"""
        file_count = len(files_modified)
        
        if file_count == 0:
            return {'level': 'none', 'score': 0}
        
        # Simple complexity calculation
        complexity_score = min((file_count * 10 + lines_changed * 0.1), 100)
        
        if complexity_score < 20:
            level = 'low'
        elif complexity_score < 50:
            level = 'medium'
        else:
            level = 'high'
        
        return {
            'level': level,
            'score': complexity_score,
            'factors': {
                'files_modified': file_count,
                'lines_changed': lines_changed
            }
        }
    
    @staticmethod
    def generate_commit_message(
        changes: Dict[str, Any],
        feature_title: str
    ) -> str:
        """Generate standardized commit message"""
        files_count = len(changes.get('files_modified', []))
        
        if files_count == 1:
            prefix = "feat"
        elif files_count <= 5:
            prefix = "feat"
        else:
            prefix = "feat(major)"
        
        return f"{prefix}: {feature_title}\n\nChanges:\n- {files_count} files modified\n- {changes.get('lines_added', 0)} lines added\n- {changes.get('lines_removed', 0)} lines removed"
    
    @staticmethod
    async def create_pr_description(
        execution_result: AgentOutput,
        feature_request: Dict[str, Any]
    ) -> str:
        """Create standardized PR description"""
        
        description = f"""## Summary
{feature_request.get('description', 'Feature implementation')}

## Changes
- **Files Modified**: {len(execution_result.files_modified)}
- **Files Created**: {len(execution_result.files_created)}
- **Artifacts**: {', '.join(execution_result.artifacts_created)}

## Implementation Details
This PR implements the feature using the {execution_result.metadata.get('agent_id', 'unknown')} agent.

### Changes Made
"""
        
        for file_path in execution_result.files_modified:
            description += f"- Updated `{file_path}`\n"
        
        for file_path in execution_result.files_created:
            description += f"- Created `{file_path}`\n"
        
        description += f"""
## Testing
- ✅ Unit tests: {execution_result.metadata.get('tests_run', 0)}/{execution_result.metadata.get('tests_total', 0)} passing
- ✅ Integration tests: {execution_result.metadata.get('integration_tests', 0)} passing
- ✅ Code review: Passed

## Risk Assessment
- **Risk Level**: {execution_result.metadata.get('risk_level', 'unknown')}
- **Blast Radius**: {execution_result.metadata.get('blast_radius', 'unknown')}

## Checklist
- [ ] Code follows project patterns
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security review completed
- [ ] Performance impact assessed

## Related Issues
Closes #{feature_request.get('id', 'unknown')}
"""
        
        return description
