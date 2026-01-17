"""
Strategic Planner Agent
Creates safe, evidence-based execution plans for feature requests
"""

import json
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import openai
from openai import AsyncOpenAI

from services.api.config import settings
from services.agents.base_agent import BaseAgent, AgentInput, AgentOutput, AgentStatus


@dataclass
class PlannerInput(AgentInput):
    feature_request: Dict[str, Any] = None
    discovery_reports: List[Dict[str, Any]] = None
    dependency_graph: Dict[str, Any] = None
    existing_api_contracts: List[Dict[str, Any]] = None


@dataclass
class PlannerOutput(AgentOutput):
    execution_plan: Dict[str, Any] = None
    blast_radius: Dict[str, Any] = None
    risk_assessment: Dict[str, Any] = None
    api_contract_proposal: Optional[Dict[str, Any]] = None
    test_strategy: Dict[str, Any] = None
    rollout_plan: Dict[str, Any] = None
    evidence_links: List[str] = None


class StrategicPlannerAgent(BaseAgent):
    """Enterprise brain for safe, evidence-based planning"""
    
    def __init__(self):
        super().__init__("strategic_planner", {})
        self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
    
    async def execute(self, input_data: PlannerInput) -> PlannerOutput:
        """Create strategic execution plan"""
        
        try:
            # Analyze feature request
            feature_analysis = await self._analyze_feature_request(input_data.feature_request)
            
            # Analyze codebase context
            context_analysis = await self._analyze_codebase_context(
                input_data.discovery_reports, 
                input_data.dependency_graph
            )
            
            # Generate execution phases
            phases = await self._generate_execution_phases(
                feature_analysis, 
                context_analysis
            )
            
            # Assess blast radius
            blast_radius = await self._assess_blast_radius(
                phases, 
                input_data.dependency_graph
            )
            
            # Create risk assessment
            risk_assessment = await self._assess_risks(
                phases, 
                blast_radius, 
                context_analysis
            )
            
            # Generate API contract if needed
            api_contract = await self._generate_api_contract(
                feature_analysis, 
                context_analysis
            )
            
            # Create test strategy
            test_strategy = await self._create_test_strategy(
                phases, 
                feature_analysis
            )
            
            # Create rollout plan
            rollout_plan = await self._create_rollout_plan(
                phases, 
                risk_assessment
            )
            
            # Generate evidence links
            evidence_links = await self._generate_evidence_links(
                input_data.discovery_reports,
                phases
            )
            
            return PlannerOutput(
                status=AgentStatus.COMPLETED,
                files_modified=[],
                files_created=[],
                artifacts_created=["execution_plan", "risk_assessment", "api_contract"],
                next_actions=["await_approval", "execute_implementation"],
                token_usage={"prompt_tokens": 2000, "completion_tokens": 1500, "total": 3500},
                execution_plan={
                    "phases": phases,
                    "estimated_duration": sum(p.get("estimated_duration_hours", 0) for p in phases),
                    "complexity": feature_analysis.get("complexity", "medium")
                },
                blast_radius=blast_radius,
                risk_assessment=risk_assessment,
                api_contract_proposal=api_contract,
                test_strategy=test_strategy,
                rollout_plan=rollout_plan,
                evidence_links=evidence_links
            )
            
        except Exception as e:
            return PlannerOutput(
                status=AgentStatus.FAILED,
                files_modified=[],
                files_created=[],
                artifacts_created=[],
                next_actions=["retry_planning"],
                token_usage={},
                error_message=f"Planning failed: {str(e)}"
            )
    
    def validate_input(self, input_data: PlannerInput) -> bool:
        """Validate planning input"""
        required_fields = ['feature_request', 'discovery_reports']
        return all(hasattr(input_data, field) and getattr(input_data, field) for field in required_fields)
    
    def estimate_tokens(self, input_data: PlannerInput) -> int:
        """Estimate token usage for planning"""
        # Rough estimation based on input size
        feature_desc = len(str(input_data.feature_request))
        discovery_size = len(str(input_data.discovery_reports))
        return (feature_desc + discovery_size) // 4 + 1000  # Base tokens for response
    
    async def _analyze_feature_request(self, feature_request: Dict) -> Dict:
        """Analyze feature request for complexity and requirements"""
        title = feature_request.get('title', '')
        description = feature_request.get('description', '')
        
        # Determine feature type
        feature_types = {
            'api_change': ['api', 'endpoint', 'route', 'backend'],
            'ui_change': ['ui', 'frontend', 'interface', 'user'],
            'database_change': ['database', 'schema', 'migration'],
            'integration': ['integrate', 'connect', 'api'],
            'performance': ['performance', 'optimize', 'speed'],
            'security': ['security', 'auth', 'permission'],
            'bug_fix': ['bug', 'fix', 'issue', 'error']
        }
        
        detected_types = []
        for feature_type, keywords in feature_types.items():
            if any(keyword in (title + ' ' + description).lower() for keyword in keywords):
                detected_types.append(feature_type)
        
        # Estimate complexity
        complexity_indicators = {
            'high': ['microservice', 'architecture', 'migration', 'integration', 'authentication'],
            'medium': ['api', 'endpoint', 'feature', 'component'],
            'low': ['fix', 'update', 'minor', 'simple']
        }
        
        complexity = 'medium'
        for level, indicators in complexity_indicators.items():
            if any(indicator in (title + ' ' + description).lower() for indicator in indicators):
                complexity = level
                break
        
        return {
            'title': title,
            'description': description,
            'types': detected_types,
            'complexity': complexity,
            'estimated_scope': self._estimate_scope(title, description)
        }
    
    async def _analyze_codebase_context(
        self, 
        discovery_reports: List[Dict], 
        dependency_graph: Dict
    ) -> Dict:
        """Analyze codebase context for planning"""
        
        # Aggregate information from discovery reports
        all_services = []
        all_stacks = []
        all_risks = []
        
        for report in discovery_reports:
            services = report.get('service_boundaries', [])
            stack = report.get('detected_stack', {})
            risks = report.get('risk_hotspots', [])
            
            all_services.extend(services)
            all_stacks.append(stack)
            all_risks.extend(risks)
        
        # Analyze service landscape
        service_types = {}
        for service in all_services:
            service_type = service.get('type', 'unknown')
            service_types[service_type] = service_types.get(service_type, 0) + 1
        
        # Analyze technology stack
        primary_languages = []
        for stack in all_stacks:
            primary_lang = stack.get('primary_language')
            if primary_lang and primary_lang != 'unknown':
                primary_languages.append(primary_lang)
        
        # Analyze dependency complexity
        edges = dependency_graph.get('edges', [])
        dependency_count = len(edges)
        
        return {
            'service_count': len(all_services),
            'service_types': service_types,
            'primary_languages': list(set(primary_languages)),
            'dependency_complexity': 'high' if dependency_count > 50 else 'medium' if dependency_count > 20 else 'low',
            'existing_risks': len(all_risks),
            'codebase_health': 'good' if len(all_risks) < 5 else 'fair' if len(all_risks) < 15 else 'poor'
        }
    
    async def _generate_execution_phases(
        self, 
        feature_analysis: Dict, 
        context_analysis: Dict
    ) -> List[Dict]:
        """Generate execution phases based on feature and context"""
        
        feature_types = feature_analysis.get('types', [])
        complexity = feature_analysis.get('complexity', 'medium')
        
        phases = []
        
        # Phase 1: Planning and Design (always included)
        phases.append({
            'phase_number': 1,
            'name': 'Planning and Design',
            'agent_type': 'planner',
            'estimated_duration_hours': 2 if complexity == 'low' else 4 if complexity == 'medium' else 8,
            'risk_level': 'low',
            'deliverables': ['execution_plan', 'api_contract', 'test_strategy'],
            'dependencies': []
        })
        
        # Phase 2: API Contract (if API changes)
        if any(ft in feature_types for ft in ['api_change', 'integration', 'database_change']):
            phases.append({
                'phase_number': 2,
                'name': 'API Contract Update',
                'agent_type': 'backend',
                'estimated_duration_hours': 2,
                'risk_level': 'medium',
                'deliverables': ['updated_api_spec', 'contract_tests'],
                'dependencies': [1]
            })
        
        # Phase 3: Backend Implementation
        if any(ft in feature_types for ft in ['api_change', 'backend', 'database_change', 'integration']):
            phases.append({
                'phase_number': len(phases) + 1,
                'name': 'Backend Implementation',
                'agent_type': 'backend',
                'estimated_duration_hours': 4 if complexity == 'low' else 8 if complexity == 'medium' else 16,
                'risk_level': 'medium',
                'deliverables': ['backend_code', 'unit_tests', 'integration_tests'],
                'dependencies': [p['phase_number'] for p in phases if p['agent_type'] == 'backend']
            })
        
        # Phase 4: Frontend Implementation
        if any(ft in feature_types for ft in ['ui_change', 'frontend']):
            phases.append({
                'phase_number': len(phases) + 1,
                'name': 'Frontend Implementation',
                'agent_type': 'frontend',
                'estimated_duration_hours': 6 if complexity == 'low' else 12 if complexity == 'medium' else 24,
                'risk_level': 'medium',
                'deliverables': ['ui_components', 'integration_code', 'component_tests'],
                'dependencies': [p['phase_number'] for p in phases if p['agent_type'] in ['backend', 'planner']]
            })
        
        # Phase 5: Code Review (always included)
        phases.append({
            'phase_number': len(phases) + 1,
            'name': 'Code Review and Security Check',
            'agent_type': 'reviewer',
            'estimated_duration_hours': 2,
            'risk_level': 'low',
            'deliverables': ['review_report', 'security_scan', 'approval'],
            'dependencies': [p['phase_number'] for p in phases if p['agent_type'] in ['backend', 'frontend']]
        })
        
        # Phase 6: Testing and QA
        phases.append({
            'phase_number': len(phases) + 1,
            'name': 'Testing and Quality Assurance',
            'agent_type': 'qa',
            'estimated_duration_hours': 3 if complexity == 'low' else 6 if complexity == 'medium' else 12,
            'risk_level': 'low',
            'deliverables': ['test_report', 'performance_metrics', 'coverage_report'],
            'dependencies': [p['phase_number'] for p in phases if p['agent_type'] != 'qa']
        })
        
        return phases
    
    async def _assess_blast_radius(
        self, 
        phases: List[Dict], 
        dependency_graph: Dict
    ) -> Dict:
        """Assess potential impact of changes"""
        
        # Count affected repositories and services
        agent_types = [p['agent_type'] for p in phases]
        
        repositories_affected = set()
        files_affected = 0
        api_endpoints_changed = 0
        
        # Estimate impact based on phases
        if 'backend' in agent_types:
            repositories_affected.add('backend_services')
            files_affected += 10  # Estimate
            api_endpoints_changed += 3  # Estimate
        
        if 'frontend' in agent_types:
            repositories_affected.add('frontend_app')
            files_affected += 15  # Estimate
        
        # Calculate risk score based on dependency complexity
        edges = dependency_graph.get('edges', [])
        dependency_risk = min(len(edges) / 100, 1.0)
        
        blast_radius_score = min(
            (len(repositories_affected) * 0.3 + 
             files_affected * 0.01 + 
             api_endpoints_changed * 0.2 + 
             dependency_risk * 0.4), 
            1.0
        )
        
        return {
            'repositories_affected': list(repositories_affected),
            'files_affected': files_affected,
            'api_endpoints_changed': api_endpoints_changed,
            'risk_score': blast_radius_score,
            'risk_level': 'low' if blast_radius_score < 0.3 else 'medium' if blast_radius_score < 0.7 else 'high',
            'potential_downtime': 'none' if blast_radius_score < 0.5 else 'minimal' if blast_radius_score < 0.8 else 'possible'
        }
    
    async def _assess_risks(
        self, 
        phases: List[Dict], 
        blast_radius: Dict, 
        context_analysis: Dict
    ) -> Dict:
        """Assess risks associated with the implementation"""
        
        risks = []
        risk_score = 0.0
        
        # Complexity risk
        total_duration = sum(p.get('estimated_duration_hours', 0) for p in phases)
        if total_duration > 20:
            risks.append({
                'type': 'complexity',
                'level': 'high',
                'description': 'Long implementation duration increases risk',
                'mitigation': 'Consider breaking into smaller features'
            })
            risk_score += 0.3
        
        # Blast radius risk
        blast_risk = blast_radius.get('risk_score', 0.0)
        if blast_risk > 0.5:
            risks.append({
                'type': 'blast_radius',
                'level': 'medium',
                'description': 'Changes affect multiple components',
                'mitigation': 'Thorough testing and gradual rollout'
            })
            risk_score += 0.2
        
        # Codebase health risk
        health = context_analysis.get('codebase_health', 'good')
        if health == 'poor':
            risks.append({
                'type': 'codebase_health',
                'level': 'high',
                'description': 'Poor codebase health increases implementation risk',
                'mitigation': 'Address existing issues before implementation'
            })
            risk_score += 0.3
        
        # Dependency complexity risk
        dep_complexity = context_analysis.get('dependency_complexity', 'low')
        if dep_complexity == 'high':
            risks.append({
                'type': 'dependencies',
                'level': 'medium',
                'description': 'High dependency complexity may cause issues',
                'mitigation': 'Careful integration testing'
            })
            risk_score += 0.2
        
        return {
            'overall_score': min(risk_score, 1.0),
            'risk_level': 'low' if risk_score < 0.3 else 'medium' if risk_score < 0.7 else 'high',
            'identified_risks': risks,
            'mitigation_strategies': [r['mitigation'] for r in risks]
        }
    
    async def _generate_api_contract(
        self, 
        feature_analysis: Dict, 
        context_analysis: Dict
    ) -> Optional[Dict]:
        """Generate API contract proposal if needed"""
        
        feature_types = feature_analysis.get('types', [])
        
        if not any(ft in feature_types for ft in ['api_change', 'integration', 'backend']):
            return None
        
        # Generate mock API contract
        return {
            'openapi_version': '3.0.0',
            'info': {
                'title': f"API Updates for {feature_analysis.get('title', 'Feature')}",
                'version': '1.0.0',
                'description': 'Generated API contract for feature implementation'
            },
            'paths': {
                '/api/v1/example': {
                    'get': {
                        'summary': 'Example endpoint',
                        'responses': {
                            '200': {
                                'description': 'Successful response',
                                'content': {
                                    'application/json': {
                                        'schema': {'type': 'object'}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            'components': {
                'schemas': {},
                'securitySchemes': {}
            }
        }
    
    async def _create_test_strategy(
        self, 
        phases: List[Dict], 
        feature_analysis: Dict
    ) -> Dict:
        """Create comprehensive testing strategy"""
        
        complexity = feature_analysis.get('complexity', 'medium')
        agent_types = [p['agent_type'] for p in phases]
        
        strategy = {
            'unit_tests': {
                'required': True,
                'coverage_target': '80%' if complexity == 'low' else '90%' if complexity == 'medium' else '95%',
                'frameworks': []
            },
            'integration_tests': {
                'required': 'backend' in agent_types or 'frontend' in agent_types,
                'coverage_target': '70%',
                'focus_areas': ['api_endpoints', 'data_flow', 'error_handling']
            },
            'e2e_tests': {
                'required': 'frontend' in agent_types,
                'coverage_target': '60%',
                'focus_areas': ['user_workflows', 'cross_browser', 'accessibility']
            },
            'performance_tests': {
                'required': complexity in ['high'],
                'metrics': ['response_time', 'throughput', 'memory_usage']
            },
            'security_tests': {
                'required': True,
                'focus_areas': ['authentication', 'authorization', 'input_validation', 'data_exposure']
            }
        }
        
        # Add framework recommendations based on context
        if 'javascript' in feature_analysis.get('types', []):
            strategy['unit_tests']['frameworks'].append('Jest')
        if 'python' in feature_analysis.get('types', []):
            strategy['unit_tests']['frameworks'].append('Pytest')
        
        return strategy
    
    async def _create_rollout_plan(
        self, 
        phases: List[Dict], 
        risk_assessment: Dict
    ) -> Dict:
        """Create rollout plan based on risk assessment"""
        
        risk_level = risk_assessment.get('risk_level', 'medium')
        
        if risk_level == 'low':
            return {
                'strategy': 'direct',
                'steps': [
                    'Deploy to staging',
                    'Run automated tests',
                    'Deploy to production',
                    'Monitor for 24 hours'
                ],
                'rollback_plan': 'Simple rollback to previous version'
            }
        
        elif risk_level == 'medium':
            return {
                'strategy': 'canary',
                'steps': [
                    'Deploy to staging',
                    'Run comprehensive tests',
                    'Deploy to 10% of production traffic',
                    'Monitor for 2 hours',
                    'Gradual rollout to 50%, then 100%'
                ],
                'rollback_plan': 'Immediate rollback with feature flag'
            }
        
        else:  # high risk
            return {
                'strategy': 'feature_flag',
                'steps': [
                    'Deploy to staging with feature flag disabled',
                    'Run extensive testing',
                    'Deploy to production with feature flag disabled',
                    'Enable for internal users only',
                    'Enable for 5% of users',
                    'Gradual rollout based on metrics'
                ],
                'rollback_plan': 'Instant disable via feature flag'
            }
    
    async def _generate_evidence_links(
        self, 
        discovery_reports: List[Dict],
        phases: List[Dict]
    ) -> List[str]:
        """Generate evidence links for plan decisions"""
        
        links = []
        
        # Link to discovery reports
        for i, report in enumerate(discovery_reports):
            links.append(f"discovery_report_{i+1}")
        
        # Link to specific files that will be modified
        for phase in phases:
            if phase.get('deliverables'):
                for deliverable in phase['deliverables']:
                    links.append(f"planned_deliverable_{deliverable}")
        
        return links
    
    def _estimate_scope(self, title: str, description: str) -> str:
        """Estimate implementation scope"""
        text = (title + ' ' + description).lower()
        
        if any(word in text for word in ['simple', 'minor', 'small', 'quick']):
            return 'small'
        elif any(word in text for word in ['complex', 'major', 'large', 'comprehensive']):
            return 'large'
        else:
            return 'medium'
