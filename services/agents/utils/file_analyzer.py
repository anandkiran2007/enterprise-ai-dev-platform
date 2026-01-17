"""
File Analysis Utilities
Detects file types, languages, and extracts metadata
"""

import os
import mimetypes
from pathlib import Path
from typing import Dict, List, Optional, Any
import aiofiles
import json


class FileAnalyzer:
    """Analyzes files to extract metadata and detect stack"""
    
    # Language detection patterns
    LANGUAGE_PATTERNS = {
        'javascript': ['.js', '.jsx', '.mjs', '.cjs'],
        'typescript': ['.ts', '.tsx'],
        'python': ['.py', '.pyw', '.pyi'],
        'java': ['.java', '.class', '.jar'],
        'go': ['.go'],
        'rust': ['.rs'],
        'csharp': ['.cs', '.csx'],
        'php': ['.php'],
        'ruby': ['.rb', '.rbw'],
        'swift': ['.swift'],
        'kotlin': ['.kt', '.kts'],
        'scala': ['.scala'],
        'cpp': ['.cpp', '.cxx', '.cc', '.c++', '.hpp', '.hxx', '.hh'],
        'c': ['.c', '.h'],
        'sql': ['.sql'],
        'html': ['.html', '.htm'],
        'css': ['.css', '.scss', '.sass', '.less'],
        'json': ['.json'],
        'yaml': ['.yaml', '.yml'],
        'xml': ['.xml'],
        'docker': ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
        'shell': ['.sh', '.bash', '.zsh', '.fish'],
    }
    
    # Configuration files for stack detection
    CONFIG_FILES = {
        'package.json': 'nodejs',
        'package-lock.json': 'nodejs',
        'yarn.lock': 'nodejs',
        'requirements.txt': 'python',
        'Pipfile': 'python',
        'Pipfile.lock': 'python',
        'pyproject.toml': 'python',
        'pom.xml': 'java',
        'build.gradle': 'java',
        'build.gradle.kts': 'java',
        'Cargo.toml': 'rust',
        'go.mod': 'go',
        'go.sum': 'go',
        'composer.json': 'php',
        'Gemfile': 'ruby',
        'Gemfile.lock': 'ruby',
        'requirements.txt': 'python',
        'setup.py': 'python',
        'Dockerfile': 'docker',
        'docker-compose.yml': 'docker',
        'docker-compose.yaml': 'docker',
        'kubernetes.yaml': 'kubernetes',
        'k8s.yaml': 'kubernetes',
        'terraform.tf': 'terraform',
        'main.tf': 'terraform',
        'openapi.yaml': 'openapi',
        'openapi.yml': 'openapi',
        'swagger.yaml': 'openapi',
        'api.yaml': 'openapi',
    }
    
    async def analyze_file(self, file_path: Path, relative_path: Path) -> Dict[str, Any]:
        """Analyze a single file and extract metadata"""
        try:
            stat = file_path.stat()
            
            file_info = {
                'path': str(relative_path),
                'name': file_path.name,
                'size': stat.st_size,
                'modified': stat.st_mtime,
                'extension': file_path.suffix.lower(),
                'language': self._detect_language(file_path),
                'mime_type': mimetypes.guess_type(str(file_path))[0],
                'is_binary': self._is_binary_file(file_path),
                'category': self._categorize_file(file_path),
            }
            
            # Extract content for text files
            if not file_info['is_binary'] and stat.st_size < 1024 * 1024:  # < 1MB
                file_info['content_preview'] = await self._get_content_preview(file_path)
            
            return file_info
            
        except Exception as e:
            return {
                'path': str(relative_path),
                'name': file_path.name,
                'error': str(e),
                'size': 0,
                'language': 'unknown'
            }
    
    async def detect_stack(self, file_tree: Dict) -> Dict[str, Any]:
        """Detect technology stack from file tree"""
        files = file_tree.get('files', [])
        
        # Analyze configuration files
        config_files = {}
        for file_info in files:
            file_name = Path(file_info['path']).name
            if file_name in self.CONFIG_FILES:
                config_files[file_name] = self.CONFIG_FILES[file_name]
        
        # Count languages
        language_counts = {}
        for file_info in files:
            lang = file_info.get('language', 'unknown')
            if lang != 'unknown':
                language_counts[lang] = language_counts.get(lang, 0) + 1
        
        # Detect primary stack
        primary_stack = self._determine_primary_stack(config_files, language_counts)
        
        # Detect frameworks and tools
        frameworks = self._detect_frameworks(files)
        databases = self._detect_databases(files)
        testing_tools = self._detect_testing_tools(files)
        
        return {
            'primary_language': primary_stack.get('language'),
            'frameworks': frameworks,
            'databases': databases,
            'testing_tools': testing_tools,
            'language_distribution': language_counts,
            'config_files': config_files,
            'stack_confidence': primary_stack.get('confidence', 0.0),
            'project_type': self._determine_project_type(config_files, language_counts)
        }
    
    def _detect_language(self, file_path: Path) -> str:
        """Detect programming language from file extension"""
        extension = file_path.suffix.lower()
        filename = file_path.name
        
        # Check exact filename matches first
        if filename in self.CONFIG_FILES:
            return self.CONFIG_FILES[filename]
        
        # Check extension patterns
        for language, extensions in self.LANGUAGE_PATTERNS.items():
            if extension in extensions:
                return language
        
        return 'unknown'
    
    def _is_binary_file(self, file_path: Path) -> bool:
        """Check if file is binary"""
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(1024)
                return b'\0' in chunk
        except Exception:
            return True
    
    def _categorize_file(self, file_path: Path) -> str:
        """Categorize file by purpose"""
        name = file_path.name.lower()
        path_parts = str(file_path).lower().split('/')
        
        # Configuration files
        if any(ext in name for ext in ['.json', '.yaml', '.yml', '.toml', '.ini', '.conf']):
            return 'config'
        
        # Test files
        if 'test' in name or 'spec' in name:
            return 'test'
        
        # Documentation
        if name.endswith(('.md', '.rst', '.txt')) or 'doc' in path_parts:
            return 'documentation'
        
        # Source code
        if any(ext in name for ext in ['.py', '.js', '.ts', '.java', '.go', '.rs']):
            return 'source'
        
        # Build files
        if name in ['Makefile', 'CMakeLists.txt', 'build.gradle', 'pom.xml']:
            return 'build'
        
        return 'other'
    
    async def _get_content_preview(self, file_path: Path, max_lines: int = 10) -> str:
        """Get content preview for text files"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = []
                async for line in f:
                    lines.append(line.rstrip())
                    if len(lines) >= max_lines:
                        break
                return '\n'.join(lines)
        except Exception:
            return ''
    
    def _determine_primary_stack(self, config_files: Dict, language_counts: Dict) -> Dict:
        """Determine primary technology stack"""
        # Weight config files more heavily
        stack_scores = {}
        
        # Score from config files
        for stack in set(config_files.values()):
            stack_scores[stack] = stack_scores.get(stack, 0) + 10
        
        # Score from language counts
        for language, count in language_counts.items():
            stack_scores[language] = stack_scores.get(language, 0) + count
        
        if not stack_scores:
            return {'language': 'unknown', 'confidence': 0.0}
        
        # Find top stack
        top_stack = max(stack_scores.items(), key=lambda x: x[1])
        confidence = min(top_stack[1] / 20.0, 1.0)  # Normalize to 0-1
        
        return {
            'language': top_stack[0],
            'confidence': confidence
        }
    
    def _detect_frameworks(self, files: List[Dict]) -> List[str]:
        """Detect frameworks from files"""
        frameworks = []
        
        # Look for framework indicators in package files
        for file_info in files:
            path = file_info['path']
            content = file_info.get('content_preview', '')
            
            if 'package.json' in path:
                if 'react' in content.lower():
                    frameworks.append('React')
                if 'vue' in content.lower():
                    frameworks.append('Vue.js')
                if 'angular' in content.lower():
                    frameworks.append('Angular')
                if 'express' in content.lower():
                    frameworks.append('Express.js')
                if 'next' in content.lower():
                    frameworks.append('Next.js')
            
            if 'requirements.txt' in path or 'Pipfile' in path:
                if 'django' in content.lower():
                    frameworks.append('Django')
                if 'flask' in content.lower():
                    frameworks.append('Flask')
                if 'fastapi' in content.lower():
                    frameworks.append('FastAPI')
        
        return list(set(frameworks))
    
    def _detect_databases(self, files: List[Dict]) -> List[str]:
        """Detect databases from configuration"""
        databases = []
        
        for file_info in files:
            content = file_info.get('content_preview', '').lower()
            
            if any(db in content for db in ['postgresql', 'postgres', 'psycopg2']):
                databases.append('PostgreSQL')
            if any(db in content for db in ['mysql', 'pymysql']):
                databases.append('MySQL')
            if any(db in content for db in ['mongodb', 'pymongo']):
                databases.append('MongoDB')
            if any(db in content for db in ['redis', 'aioredis']):
                databases.append('Redis')
            if any(db in content for db in ['sqlite', 'sqlite3']):
                databases.append('SQLite')
        
        return list(set(databases))
    
    def _detect_testing_tools(self, files: List[Dict]) -> List[str]:
        """Detect testing frameworks"""
        tools = []
        
        for file_info in files:
            path = file_info['path']
            content = file_info.get('content_preview', '').lower()
            
            if 'jest' in content or 'jest.config' in path:
                tools.append('Jest')
            if 'pytest' in content or 'pytest.ini' in path:
                tools.append('Pytest')
            if 'unittest' in content:
                tools.append('unittest')
            if 'mocha' in content:
                tools.append('Mocha')
            if 'jasmine' in content:
                tools.append('Jasmine')
        
        return list(set(tools))
    
    def _determine_project_type(self, config_files: Dict, language_counts: Dict) -> str:
        """Determine project type"""
        if 'docker' in config_files:
            return 'containerized'
        
        if any(lang in language_counts for lang in ['javascript', 'typescript']):
            return 'web_frontend'
        
        if 'python' in language_counts:
            if any(framework in config_files.values() for framework in ['django', 'flask', 'fastapi']):
                return 'web_backend'
            return 'python_application'
        
        if 'java' in language_counts:
            return 'java_application'
        
        if 'go' in language_counts:
            return 'go_service'
        
        return 'general'
