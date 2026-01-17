"""
Code Discovery Service
Analyzes repository structure to detect architecture, dependencies, and risks
"""

import re
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

from services.agents.utils.file_analyzer import FileAnalyzer


@dataclass
class DiscoveryResult:
    repository_id: str
    report_id: str
    detected_stack: Dict[str, Any]
    service_boundaries: List[Dict[str, Any]]
    dependency_graph: Dict[str, Any]
    risk_score: float
    risk_hotspots: List[Dict[str, Any]]


class DiscoveryService:
    """Analyzes code repositories to extract architectural insights"""
    
    def __init__(self):
        self.file_analyzer = FileAnalyzer()
    
    async def analyze_repository(self, repository_id: str) -> DiscoveryResult:
        """Perform comprehensive repository analysis"""
        
        # TODO: Load file tree from database
        file_tree = await self._load_file_tree(repository_id)
        
        # Detect service boundaries
        service_boundaries = await self._detect_service_boundaries(file_tree)
        
        # Build dependency graph
        dependency_graph = await self._build_dependency_graph(file_tree)
        
        # Analyze risks
        risk_analysis = await self._analyze_risks(file_tree, dependency_graph)
        
        # Generate report ID
        report_id = f"discovery_{repository_id}_{int(time.time())}"
        
        return DiscoveryResult(
            repository_id=repository_id,
            report_id=report_id,
            detected_stack=await self.file_analyzer.detect_stack(file_tree),
            service_boundaries=service_boundaries,
            dependency_graph=dependency_graph,
            risk_score=risk_analysis['overall_score'],
            risk_hotspots=risk_analysis['hotspots']
        )
    
    async def _load_file_tree(self, repository_id: str) -> Dict:
        """Load file tree from database or cache"""
        # TODO: Implement database lookup
        # For now, return mock data
        return {
            'files': [
                {
                    'path': 'src/main.js',
                    'language': 'javascript',
                    'category': 'source',
                    'content_preview': 'const express = require("express");'
                },
                {
                    'path': 'src/routes/users.js',
                    'language': 'javascript',
                    'category': 'source',
                    'content_preview': 'router.get("/users", async (req, res) => {'
                },
                {
                    'path': 'package.json',
                    'language': 'nodejs',
                    'category': 'config',
                    'content_preview': '{"name": "my-app", "dependencies": {"express": "^4.18.0"}}'
                }
            ],
            'directories': ['src', 'tests', 'docs']
        }
    
    async def _detect_service_boundaries(self, file_tree: Dict) -> List[Dict[str, Any]]:
        """Detect service boundaries in the codebase"""
        files = file_tree.get('files', [])
        directories = file_tree.get('directories', [])
        
        services = []
        
        # Analyze directory structure for service boundaries
        service_patterns = {
            'api': ['api', 'routes', 'controllers', 'handlers'],
            'auth': ['auth', 'authentication', 'security'],
            'database': ['db', 'database', 'models', 'schemas'],
            'utils': ['utils', 'helpers', 'common', 'shared'],
            'config': ['config', 'settings', 'env'],
            'tests': ['test', 'tests', 'spec', 'specs'],
            'frontend': ['frontend', 'client', 'ui', 'web', 'static'],
            'services': ['services', 'business', 'domain'],
            'middleware': ['middleware', 'interceptors']
        }
        
        # Detect services based on directory structure
        for directory in directories:
            for service_type, patterns in service_patterns.items():
                if any(pattern in directory.lower() for pattern in patterns):
                    # Find files in this service
                    service_files = [
                        f for f in files 
                        if f['path'].startswith(directory) or any(p in f['path'] for p in patterns)
                    ]
                    
                    services.append({
                        'name': directory,
                        'type': service_type,
                        'files': service_files,
                        'languages': list(set(f.get('language', 'unknown') for f in service_files)),
                        'complexity': await self._calculate_service_complexity(service_files)
                    })
        
        # Detect microservices patterns
        microservices = await self._detect_microservices(files, directories)
        services.extend(microservices)
        
        return services
    
    async def _detect_microservices(self, files: List[Dict], directories: List[str]) -> List[Dict[str, Any]]:
        """Detect microservice patterns"""
        microservices = []
        
        # Look for service-specific indicators
        service_indicators = [
            'docker-compose', 'kubernetes', 'helm', 'terraform',
            'service', 'microservice', 'api-gateway'
        ]
        
        for directory in directories:
            dir_files = [f for f in files if f['path'].startswith(directory)]
            
            # Check for service indicators
            has_service_config = any(
                any(indicator in f['path'].lower() for indicator in service_indicators)
                for f in dir_files
            )
            
            # Check for API definitions
            has_api = any(
                'api' in f['path'].lower() or 'route' in f['path'].lower()
                for f in dir_files
            )
            
            if has_service_config or has_api:
                microservices.append({
                    'name': directory,
                    'type': 'microservice',
                    'files': dir_files,
                    'languages': list(set(f.get('language', 'unknown') for f in dir_files)),
                    'complexity': await self._calculate_service_complexity(dir_files),
                    'is_isolated': await self._check_service_isolation(dir_files)
                })
        
        return microservices
    
    async def _build_dependency_graph(self, file_tree: Dict) -> Dict[str, Any]:
        """Build dependency graph from code analysis"""
        files = file_tree.get('files', [])
        
        # Extract dependencies from different file types
        dependencies = {
            'imports': [],
            'api_calls': [],
            'database_connections': [],
            'external_services': [],
            'shared_libraries': []
        }
        
        for file_info in files:
            content = file_info.get('content_preview', '')
            file_path = file_info['path']
            language = file_info.get('language', 'unknown')
            
            # Analyze based on language
            if language == 'javascript':
                deps = await self._analyze_js_dependencies(content, file_path)
                dependencies['imports'].extend(deps['imports'])
                dependencies['api_calls'].extend(deps['api_calls'])
            
            elif language == 'python':
                deps = await self._analyze_python_dependencies(content, file_path)
                dependencies['imports'].extend(deps['imports'])
                dependencies['database_connections'].extend(deps['database_connections'])
            
            elif language == 'java':
                deps = await self._analyze_java_dependencies(content, file_path)
                dependencies['imports'].extend(deps['imports'])
                dependencies['external_services'].extend(deps['external_services'])
        
        # Build graph structure
        graph = {
            'nodes': [],
            'edges': [],
            'dependencies': dependencies
        }
        
        # Create nodes (files/services)
        for file_info in files:
            graph['nodes'].append({
                'id': file_info['path'],
                'type': file_info.get('category', 'unknown'),
                'language': file_info.get('language', 'unknown')
            })
        
        # Create edges (dependencies)
        for dep_type, deps in dependencies.items():
            for dep in deps:
                if dep.get('source') and dep.get('target'):
                    graph['edges'].append({
                        'source': dep['source'],
                        'target': dep['target'],
                        'type': dep_type,
                        'strength': dep.get('strength', 'medium')
                    })
        
        return graph
    
    async def _analyze_js_dependencies(self, content: str, file_path: str) -> Dict:
        """Analyze JavaScript/TypeScript dependencies"""
        dependencies = {
            'imports': [],
            'api_calls': []
        }
        
        # Find import statements
        import_patterns = [
            r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'require\([\'"]([^\'"]+)[\'"]\)',
            r'import\s+[\'"]([^\'"]+)[\'"]'
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if not match.startswith('.'):
                    dependencies['imports'].append({
                        'source': file_path,
                        'target': match,
                        'type': 'import',
                        'external': True
                    })
        
        # Find API calls
        api_patterns = [
            r'fetch\([\'"]([^\'"]+)[\'"]',
            r'axios\.[get|post|put|delete]+\([\'"]([^\'"]+)[\'"]',
            r'\.get\([\'"]([^\'"]+)[\'"]',
            r'\.post\([\'"]([^\'"]+)[\'"]'
        ]
        
        for pattern in api_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if match.startswith('/'):
                    dependencies['api_calls'].append({
                        'source': file_path,
                        'target': match,
                        'type': 'api_call',
                        'internal': True
                    })
        
        return dependencies
    
    async def _analyze_python_dependencies(self, content: str, file_path: str) -> Dict:
        """Analyze Python dependencies"""
        dependencies = {
            'imports': [],
            'database_connections': []
        }
        
        # Find import statements
        import_patterns = [
            r'import\s+([a-zA-Z_][a-zA-Z0-9_]*)',
            r'from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+import'
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if '.' not in match and not match.startswith('_'):
                    dependencies['imports'].append({
                        'source': file_path,
                        'target': match,
                        'type': 'import',
                        'external': True
                    })
        
        # Find database connections
        db_patterns = [
            r'psycopg2\.connect',
            r'SQLAlchemy\(',
            r'Database\(',
            r'MongoClient\(',
            r'redis\.',
            r'sqlite3\.connect'
        ]
        
        for pattern in db_patterns:
            if re.search(pattern, content):
                db_type = pattern.split('\\')[0].split('\\(')[0]
                dependencies['database_connections'].append({
                    'source': file_path,
                    'target': db_type,
                    'type': 'database_connection'
                })
        
        return dependencies
    
    async def _analyze_java_dependencies(self, content: str, file_path: str) -> Dict:
        """Analyze Java dependencies"""
        dependencies = {
            'imports': [],
            'external_services': []
        }
        
        # Find import statements
        import_pattern = r'import\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s*;'
        matches = re.findall(import_pattern, content)
        
        for match in matches:
            if not match.startswith('java.'):
                dependencies['imports'].append({
                    'source': file_path,
                    'target': match,
                    'type': 'import',
                    'external': True
                })
        
        # Find service annotations
        service_patterns = [
            r'@RestController',
            r'@Service',
            r'@Repository',
            r'@Component',
            r'@Autowired'
        ]
        
        for pattern in service_patterns:
            if re.search(pattern, content):
                dependencies['external_services'].append({
                    'source': file_path,
                    'target': pattern.replace('@', ''),
                    'type': 'service_annotation'
                })
        
        return dependencies
    
    async def _calculate_service_complexity(self, files: List[Dict]) -> Dict:
        """Calculate complexity metrics for a service"""
        total_files = len(files)
        language_counts = {}
        
        for file_info in files:
            lang = file_info.get('language', 'unknown')
            language_counts[lang] = language_counts.get(lang, 0) + 1
        
        # Simple complexity calculation
        complexity_score = min(total_files * 10, 100)  # Cap at 100
        
        return {
            'file_count': total_files,
            'language_distribution': language_counts,
            'complexity_score': complexity_score,
            'complexity_level': 'low' if complexity_score < 30 else 'medium' if complexity_score < 70 else 'high'
        }
    
    async def _check_service_isolation(self, files: List[Dict]) -> bool:
        """Check if service has proper isolation"""
        # Look for configuration files, API definitions, etc.
        has_config = any('config' in f['path'].lower() for f in files)
        has_api = any('api' in f['path'].lower() or 'route' in f['path'].lower() for f in files)
        has_tests = any('test' in f['path'].lower() for f in files)
        
        return has_config and has_api
    
    async def _analyze_risks(self, file_tree: Dict, dependency_graph: Dict) -> Dict:
        """Analyze risks in the codebase"""
        files = file_tree.get('files', [])
        edges = dependency_graph.get('edges', [])
        
        risk_hotspots = []
        risk_factors = {
            'no_tests': 0,
            'high_coupling': 0,
            'security_issues': 0,
            'complexity': 0,
            'outdated_deps': 0
        }
        
        # Check for missing tests
        test_files = [f for f in files if 'test' in f['path'].lower()]
        source_files = [f for f in files if f.get('category') == 'source']
        
        if len(test_files) < len(source_files) * 0.3:  # Less than 30% test coverage
            risk_hotspots.append({
                'type': 'low_test_coverage',
                'severity': 'high',
                'description': 'Insufficient test coverage detected',
                'affected_files': len(source_files) - len(test_files)
            })
            risk_factors['no_tests'] = 3
        
        # Check for high coupling
        coupling_threshold = 10
        file_dependencies = {}
        
        for edge in edges:
            source = edge['source']
            file_dependencies[source] = file_dependencies.get(source, 0) + 1
        
        highly_coupled = [f for f, deps in file_dependencies.items() if deps > coupling_threshold]
        if highly_coupled:
            risk_hotspots.append({
                'type': 'high_coupling',
                'severity': 'medium',
                'description': 'High coupling detected between components',
                'affected_files': highly_coupled
            })
            risk_factors['high_coupling'] = len(highly_coupled)
        
        # Check for security issues
        security_patterns = [
            (r'eval\s*\(', 'code_injection'),
            (r'exec\s*\(', 'code_injection'),
            (r'shell_exec', 'command_injection'),
            (r'sql.*\+.*[\'"]', 'sql_injection'),
            (r'innerHTML\s*=', 'xss'),
            (r'document\.write', 'xss')
        ]
        
        for file_info in files:
            content = file_info.get('content_preview', '')
            for pattern, issue_type in security_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    risk_hotspots.append({
                        'type': 'security_issue',
                        'severity': 'critical',
                        'description': f'Potential {issue_type} vulnerability',
                        'affected_file': file_info['path']
                    })
                    risk_factors['security_issues'] += 1
        
        # Calculate overall risk score
        total_risk = sum(risk_factors.values())
        max_possible_risk = 20  # Adjust based on factors
        overall_score = min(total_risk / max_possible_risk, 1.0)
        
        return {
            'overall_score': overall_score,
            'risk_level': 'low' if overall_score < 0.3 else 'medium' if overall_score < 0.7 else 'high',
            'risk_factors': risk_factors,
            'hotspots': risk_hotspots
        }


# Import time for timestamp generation
import time
