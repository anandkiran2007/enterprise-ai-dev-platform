"""
Repository Synchronization Service
Handles cloning, file tree extraction, and change detection
"""

import os
import hashlib
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import git
import aiofiles
from github import Github
from github.Repository import Repository

from services.api.config import settings
from services.agents.utils.file_analyzer import FileAnalyzer


@dataclass
class SyncResult:
    repository_id: str
    file_tree_hash: str
    files_processed: int
    directories: int
    detected_changes: List[str]
    stack_info: Dict[str, any]
    sync_type: str


class RepositorySyncService:
    """Handles repository synchronization and analysis"""
    
    def __init__(self):
        self.file_analyzer = FileAnalyzer()
        self.clone_base = Path("/tmp/enterprise-ai-repos")
        self.clone_base.mkdir(exist_ok=True)
    
    async def sync_repository(
        self, 
        repo_id: str, 
        clone_url: str, 
        branch: str = "main",
        access_type: str = "github_app",
        credentials: Optional[str] = None
    ) -> SyncResult:
        """Synchronize repository and extract file tree"""
        
        repo_path = self.clone_base / repo_id
        repo_path.mkdir(exist_ok=True)
        
        try:
            # Clone or update repository
            if (repo_path / ".git").exists():
                await self._update_repository(repo_path, branch)
            else:
                await self._clone_repository(repo_path, clone_url, branch, access_type, credentials)
            
            # Analyze file tree
            file_tree = await self._analyze_file_tree(repo_path)
            
            # Generate hash
            file_tree_hash = self._generate_file_tree_hash(file_tree)
            
            # Detect stack
            stack_info = await self.file_analyzer.detect_stack(file_tree)
            
            # Detect changes (compare with previous hash)
            detected_changes = await self._detect_changes(repo_id, file_tree_hash, file_tree)
            
            return SyncResult(
                repository_id=repo_id,
                file_tree_hash=file_tree_hash,
                files_processed=len(file_tree["files"]),
                directories=len(file_tree["directories"]),
                detected_changes=detected_changes,
                stack_info=stack_info,
                sync_type="full"
            )
            
        except Exception as e:
            raise Exception(f"Repository sync failed: {str(e)}")
        finally:
            # Cleanup
            await self._cleanup_repo(repo_path)
    
    async def _clone_repository(
        self, 
        repo_path: Path, 
        clone_url: str, 
        branch: str,
        access_type: str,
        credentials: Optional[str]
    ):
        """Clone repository with appropriate authentication"""
        
        if access_type == "github_app":
            # Use GitHub App authentication
            g = Github(credentials)
            # Parse repo name from clone_url
            repo_name = clone_url.split("github.com/")[-1].replace(".git", "")
            github_repo = g.get_repo(repo_name)
            
            # Clone using GitHub API
            git.Repo.clone_from(
                github_repo.clone_url,
                repo_path,
                branch=branch,
                depth=1  # Shallow clone for faster sync
            )
        else:
            # Standard git clone with PAT/SSH
            auth_clone_url = self._prepare_authenticated_url(clone_url, access_type, credentials)
            git.Repo.clone_from(auth_clone_url, repo_path, branch=branch, depth=1)
    
    async def _update_repository(self, repo_path: Path, branch: str):
        """Update existing repository"""
        repo = git.Repo(repo_path)
        repo.git.fetch('--depth', '1', 'origin', branch)
        repo.git.checkout(branch)
        repo.git.reset('--hard', f'origin/{branch}')
    
    async def _analyze_file_tree(self, repo_path: Path) -> Dict:
        """Analyze repository file tree"""
        files = []
        directories = []
        
        for item in repo_path.rglob("*"):
            if item.is_file():
                # Skip git files and binaries
                if self._should_include_file(item):
                    rel_path = item.relative_to(repo_path)
                    file_info = await self.file_analyzer.analyze_file(item, rel_path)
                    files.append(file_info)
            elif item.is_dir() and not self._should_skip_directory(item):
                rel_path = item.relative_to(repo_path)
                directories.append(str(rel_path))
        
        return {
            "files": files,
            "directories": directories,
            "root_path": str(repo_path)
        }
    
    def _should_include_file(self, file_path: Path) -> bool:
        """Check if file should be included in analysis"""
        exclude_patterns = [
            ".git", "node_modules", "__pycache__", ".vscode", 
            ".idea", "dist", "build", "target", "*.pyc", "*.class",
            "*.jar", "*.war", "*.exe", "*.dll", "*.so"
        ]
        
        path_str = str(file_path)
        return not any(pattern in path_str for pattern in exclude_patterns)
    
    def _should_skip_directory(self, dir_path: Path) -> bool:
        """Check if directory should be skipped"""
        skip_dirs = {".git", "node_modules", "__pycache__", ".vscode", ".idea", "dist", "build", "target"}
        return dir_path.name in skip_dirs
    
    def _generate_file_tree_hash(self, file_tree: Dict) -> str:
        """Generate hash of file tree for change detection"""
        # Sort files for consistent hashing
        sorted_files = sorted(file_tree["files"], key=lambda x: x["path"])
        
        # Create hash content
        hash_content = ""
        for file_info in sorted_files:
            hash_content += f"{file_info['path']}:{file_info['size']}:{file_info['modified']}"
        
        return hashlib.sha256(hash_content.encode()).hexdigest()
    
    async def _detect_changes(self, repo_id: str, new_hash: str, file_tree: Dict) -> List[str]:
        """Detect changes by comparing with previous hash"""
        # TODO: Implement database lookup for previous hash
        # For now, return all files as changes
        return [file["path"] for file in file_tree["files"][:10]]  # Limit for demo
    
    def _prepare_authenticated_url(self, clone_url: str, access_type: str, credentials: str) -> str:
        """Prepare authenticated clone URL"""
        if access_type == "pat":
            # Insert PAT into URL
            if clone_url.startswith("https://"):
                return clone_url.replace("https://", f"https://{credentials}@")
        return clone_url
    
    async def _cleanup_repo(self, repo_path: Path):
        """Clean up cloned repository"""
        import shutil
        try:
            shutil.rmtree(repo_path)
        except Exception:
            pass


# Integration helper for coding tools
class CodingToolIntegration:
    """Helper class for VS Code, Cursor, and other coding tools"""
    
    @staticmethod
    def get_workspace_info(workspace_path: str) -> Dict:
        """Extract workspace information for coding tool integration"""
        workspace = Path(workspace_path)
        
        return {
            "workspace_path": str(workspace),
            "git_repos": CodingToolIntegration._find_git_repos(workspace),
            "language_distribution": CodingToolIntegration._analyze_languages(workspace),
            "project_structure": CodingToolIntegration._get_project_structure(workspace)
        }
    
    @staticmethod
    def _find_git_repos(workspace: Path) -> List[Dict]:
        """Find all git repositories in workspace"""
        repos = []
        for item in workspace.rglob(".git"):
            if item.is_dir():
                repo_path = item.parent
                try:
                    repo = git.Repo(repo_path)
                    repos.append({
                        "path": str(repo_path),
                        "name": repo_path.name,
                        "remote_url": repo.remotes.origin.url if repo.remotes else None,
                        "branch": repo.active_branch.name if repo.active_branch else None,
                        "is_dirty": repo.is_dirty()
                    })
                except Exception:
                    pass
        return repos
    
    @staticmethod
    def _analyze_languages(workspace: Path) -> Dict[str, int]:
        """Analyze language distribution in workspace"""
        extensions = {}
        for file_path in workspace.rglob("*"):
            if file_path.is_file():
                ext = file_path.suffix.lower()
                if ext:
                    extensions[ext] = extensions.get(ext, 0) + 1
        return extensions
    
    @staticmethod
    def _get_project_structure(workspace: Path) -> Dict:
        """Get project structure for analysis"""
        structure = {}
        for item in workspace.iterdir():
            if item.is_dir():
                structure[item.name] = "directory"
            else:
                structure[item.name] = "file"
        return structure
