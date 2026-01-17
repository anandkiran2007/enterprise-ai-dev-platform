"""
Agent Worker Process
Handles background processing of repository sync, discovery, and agent execution
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
import aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from services.api.database import AsyncSessionLocal
from services.agents.repository_sync import RepositorySyncService, CodingToolIntegration
from services.agents.discovery_service import DiscoveryService
from services.agents.strategic_planner import StrategicPlannerAgent
from services.api.config import settings

# Configure logging
logging.basicConfig(level=getattr(logging, settings.log_level))
logger = logging.getLogger(__name__)


class AgentWorker:
    """Main agent worker for background processing"""
    
    def __init__(self, worker_id: str):
        self.worker_id = worker_id
        self.redis_client = None
        self.sync_service = RepositorySyncService()
        self.discovery_service = DiscoveryService()
        self.planner_agent = StrategicPlannerAgent()
        
    async def start(self):
        """Start the agent worker"""
        logger.info(f"Starting agent worker: {self.worker_id}")
        
        # Connect to Redis
        self.redis_client = aioredis.from_url(settings.redis_url)
        
        # Start consumer groups
        await asyncio.gather(
            self._process_repository_events(),
            self._process_discovery_events(),
            self._process_planning_events(),
            self._process_coding_tool_events()
        )
    
    async def _process_repository_events(self):
        """Process repository sync events"""
        try:
            # Create consumer group if it doesn't exist
            try:
                await self.redis_client.xgroup_create(
                    'repository-events', 'sync-workers', id='0', mkstream=True
                )
            except Exception:
                pass  # Group already exists
            
            while True:
                try:
                    # Read events from Redis stream
                    events = await self.redis_client.xreadgroup(
                        'sync-workers', 'repository-events', 
                        {self.worker_id: '>'}, count=1, block=1000
                    )
                    
                    for stream, event_list in events:
                        for event_id, event_data in event_list:
                            await self._handle_repository_event(event_id, event_data)
                            
                            # Acknowledge event
                            await self.redis_client.xack(
                                'repository-events', 'sync-workers', event_id
                            )
                
                except Exception as e:
                    logger.error(f"Error processing repository event: {e}")
                    await asyncio.sleep(5)
                    
        except Exception as e:
            logger.error(f"Repository event processor failed: {e}")
    
    async def _process_discovery_events(self):
        """Process code discovery events"""
        try:
            try:
                await self.redis_client.xgroup_create(
                    'discovery-events', 'discovery-workers', id='0', mkstream=True
                )
            except Exception:
                pass
            
            while True:
                try:
                    events = await self.redis_client.xreadgroup(
                        'discovery-workers', 'discovery-events',
                        {self.worker_id: '>'}, count=1, block=1000
                    )
                    
                    for stream, event_list in events:
                        for event_id, event_data in event_list:
                            await self._handle_discovery_event(event_id, event_data)
                            
                            await self.redis_client.xack(
                                'discovery-events', 'discovery-workers', event_id
                            )
                
                except Exception as e:
                    logger.error(f"Error processing discovery event: {e}")
                    await asyncio.sleep(5)
                    
        except Exception as e:
            logger.error(f"Discovery event processor failed: {e}")
    
    async def _process_planning_events(self):
        """Process strategic planning events"""
        try:
            try:
                await self.redis_client.xgroup_create(
                    'planning-events', 'planner-workers', id='0', mkstream=True
                )
            except Exception:
                pass
            
            while True:
                try:
                    events = await self.redis_client.xreadgroup(
                        'planner-workers', 'planning-events',
                        {self.worker_id: '>'}, count=1, block=1000
                    )
                    
                    for stream, event_list in events:
                        for event_id, event_data in event_list:
                            await self._handle_planning_event(event_id, event_data)
                            
                            await self.redis_client.xack(
                                'planning-events', 'planner-workers', event_id
                            )
                
                except Exception as e:
                    logger.error(f"Error processing planning event: {e}")
                    await asyncio.sleep(5)
                    
        except Exception as e:
            logger.error(f"Planning event processor failed: {e}")
    
    async def _process_coding_tool_events(self):
        """Process events from coding tools (VS Code, Cursor, etc.)"""
        try:
            try:
                await self.redis_client.xgroup_create(
                    'coding-tool-events', 'integration-workers', id='0', mkstream=True
                )
            except Exception:
                pass
            
            while True:
                try:
                    events = await self.redis_client.xreadgroup(
                        'integration-workers', 'coding-tool-events',
                        {self.worker_id: '>'}, count=1, block=1000
                    )
                    
                    for stream, event_list in events:
                        for event_id, event_data in event_list:
                            await self._handle_coding_tool_event(event_id, event_data)
                            
                            await self.redis_client.xack(
                                'coding-tool-events', 'integration-workers', event_id
                            )
                
                except Exception as e:
                    logger.error(f"Error processing coding tool event: {e}")
                    await asyncio.sleep(5)
                    
        except Exception as e:
            logger.error(f"Coding tool event processor failed: {e}")
    
    async def _handle_repository_event(self, event_id: str, event_data: Dict):
        """Handle repository sync event"""
        try:
            event_type = event_data.get('type')
            data = event_data.get('data', {})
            
            if event_type == 'repo.sync.started':
                repo_id = data.get('repository_id')
                clone_url = data.get('clone_url')
                branch = data.get('branch', 'main')
                access_type = data.get('access_type')
                
                logger.info(f"Starting sync for repository: {repo_id}")
                
                # Perform sync
                sync_result = await self.sync_service.sync_repository(
                    repo_id, clone_url, branch, access_type
                )
                
                # Publish completion event
                await self._publish_event('repository-events', {
                    'type': 'repo.sync.completed',
                    'data': {
                        'repository_id': sync_result.repository_id,
                        'file_tree_hash': sync_result.file_tree_hash,
                        'files_processed': sync_result.files_processed,
                        'detected_changes': sync_result.detected_changes,
                        'stack_info': sync_result.stack_info
                    }
                })
                
                # Trigger discovery if this is first sync
                if sync_result.sync_type == 'full':
                    await self._publish_event('discovery-events', {
                        'type': 'discovery.started',
                        'data': {
                            'repository_id': repo_id,
                            'discovery_type': 'full'
                        }
                    })
            
        except Exception as e:
            logger.error(f"Failed to handle repository event {event_id}: {e}")
    
    async def _handle_discovery_event(self, event_id: str, event_data: Dict):
        """Handle code discovery event"""
        try:
            data = event_data.get('data', {})
            repo_id = data.get('repository_id')
            
            logger.info(f"Starting discovery for repository: {repo_id}")
            
            # Perform discovery
            discovery_result = await self.discovery_service.analyze_repository(repo_id)
            
            # Publish completion event
            await self._publish_event('discovery-events', {
                'type': 'discovery.completed',
                'data': {
                    'repository_id': repo_id,
                    'discovery_report_id': discovery_result.report_id,
                    'detected_stack': discovery_result.detected_stack,
                    'service_boundaries': discovery_result.service_boundaries,
                    'dependency_graph': discovery_result.dependency_graph,
                    'risk_score': discovery_result.risk_score
                }
            })
            
        except Exception as e:
            logger.error(f"Failed to handle discovery event {event_id}: {e}")
    
    async def _handle_planning_event(self, event_id: str, event_data: Dict):
        """Handle strategic planning event"""
        try:
            data = event_data.get('data', {})
            feature_request_id = data.get('feature_request_id')
            
            logger.info(f"Starting planning for feature: {feature_request_id}")
            
            # Perform planning
            plan_result = await self.planner_agent.create_execution_plan(feature_request_id)
            
            # Publish completion event
            await self._publish_event('planning-events', {
                'type': 'planning.completed',
                'data': {
                    'execution_plan_id': plan_result.plan_id,
                    'feature_request_id': feature_request_id,
                    'phases': plan_result.phases,
                    'blast_radius': plan_result.blast_radius,
                    'risk_assessment': plan_result.risk_assessment
                }
            })
            
        except Exception as e:
            logger.error(f"Failed to handle planning event {event_id}: {e}")
    
    async def _handle_coding_tool_event(self, event_id: str, event_data: Dict):
        """Handle coding tool integration event"""
        try:
            event_type = event_data.get('type')
            data = event_data.get('data', {})
            
            if event_type == 'workspace.analyzed':
                workspace_path = data.get('workspace_path')
                
                logger.info(f"Analyzing coding tool workspace: {workspace_path}")
                
                # Extract workspace information
                workspace_info = CodingToolIntegration.get_workspace_info(workspace_path)
                
                # Publish analysis result
                await self._publish_event('coding-tool-events', {
                    'type': 'workspace.analysis.completed',
                    'data': {
                        'workspace_path': workspace_path,
                        'analysis': workspace_info
                    }
                })
            
        except Exception as e:
            logger.error(f"Failed to handle coding tool event {event_id}: {e}")
    
    async def _publish_event(self, stream: str, event: Dict):
        """Publish event to Redis stream"""
        try:
            await self.redis_client.xadd(stream, event)
            logger.debug(f"Published event to {stream}: {event.get('type')}")
        except Exception as e:
            logger.error(f"Failed to publish event to {stream}: {e}")


async def main():
    """Main worker entry point"""
    import os
    
    worker_id = os.getenv('WORKER_ID', f'worker-{os.getpid()}')
    worker = AgentWorker(worker_id)
    
    try:
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Worker shutting down...")
    except Exception as e:
        logger.error(f"Worker crashed: {e}")
    finally:
        if worker.redis_client:
            await worker.redis_client.close()


if __name__ == "__main__":
    asyncio.run(main())
