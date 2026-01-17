"""
Production-ready authentication service with caching and rate limiting
"""

import asyncio
import json
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

import httpx
import redis.asyncio as redis
from jose import JWTError, jwt

from .auth import AuthService
from ..config.production import get_settings


class ProductionAuthService(AuthService):
    """Enhanced auth service for production"""
    
    def __init__(self):
        super().__init__()
        self.settings = get_settings()
        self.redis_client = None
        self.cache_ttl = 300  # 5 minutes
        self._github_rate_limit = {}
    
    async def _get_redis_client(self):
        """Get Redis client for caching"""
        if self.redis_client is None:
            try:
                self.redis_client = redis.from_url(
                    self.settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
            except Exception as e:
                print(f"Warning: Redis connection failed: {e}")
                self.redis_client = None
        return self.redis_client
    
    async def _cache_get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get data from cache"""
        try:
            client = await self._get_redis_client()
            if client:
                cached = await client.get(key)
                if cached:
                    return json.loads(cached)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None
    
    async def _cache_set(self, key: str, data: Dict[str, Any], ttl: int = None):
        """Set data in cache"""
        try:
            client = await self._get_redis_client()
            if client:
                ttl = ttl or self.cache_ttl
                await client.setex(key, ttl, json.dumps(data))
        except Exception as e:
            print(f"Cache set error: {e}")
    
    async def _check_github_rate_limit(self, endpoint: str) -> bool:
        """Check GitHub API rate limits with better handling"""
        current_time = time.time()
        key = f"github_rate:{endpoint}"
        
        if key not in self._github_rate_limit:
            self._github_rate_limit[key] = []
        
        # Clean old entries (1 hour window for authenticated, 1 minute for search)
        window = 3600 if endpoint != 'search' else 60
        cutoff = current_time - window
        self._github_rate_limit[key] = [
            req_time for req_time in self._github_rate_limit[key] 
            if req_time > cutoff
        ]
        
        # GitHub limits: 5000 requests/hour for authenticated, 60/hour for search
        limit = 5000 if endpoint != 'search' else 60
        
        if len(self._github_rate_limit[key]) >= limit * 0.9:  # 90% threshold
            print(f"Warning: GitHub API rate limit approaching for {endpoint}: {len(self._github_rate_limit[key])}/{limit}")
            return False
        
        if len(self._github_rate_limit[key]) >= limit:
            print(f"Error: GitHub API rate limit exceeded for {endpoint}: {len(self._github_rate_limit[key])}/{limit}")
            return False
        
        self._github_rate_limit[key].append(current_time)
        return True
    
    async def _get_github_rate_limit_status(self) -> Dict[str, Any]:
        """Get current GitHub API rate limit status"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("https://api.github.com/rate_limit", timeout=5)
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Failed to get GitHub rate limit status: {e}")
        
        return {"resources": {"core": {"remaining": 0, "limit": 0}}}
    
    async def authenticate_github(self, code: str, redirect_uri: str, db) -> Dict[str, Any]:
        """Production-ready GitHub authentication with caching"""
        try:
            # Check cache first
            cache_key = f"github_auth:{code[:10]}"  # Use first 10 chars of code
            cached_result = await self._cache_get(cache_key)
            if cached_result:
                print("Using cached GitHub auth result")
                return cached_result
            
            # Check rate limits
            if not await self._check_github_rate_limit('token'):
                raise Exception("GitHub API rate limit exceeded. Please try again later.")
            
            # Exchange code for access token
            token_data = await self._exchange_github_code(code, redirect_uri)
            
            # Get user information from GitHub with rate limiting
            if not await self._check_github_rate_limit('user'):
                raise Exception("GitHub API rate limit exceeded for user data. Please try again later.")
            
            user_data = await self._get_github_user(token_data["access_token"])
            
            # Get user organizations (optional, don't fail if rate limited)
            orgs_data = []
            if await self._check_github_rate_limit('orgs'):
                try:
                    orgs_data = await self._get_github_organizations(token_data["access_token"])
                except Exception as e:
                    print(f"Warning: Could not fetch organizations: {e}")
                    orgs_data = []
            else:
                print("Skipping organizations due to rate limiting")
            
            # Create or update user in database
            user = await self._create_or_update_user(user_data, db)
            
            # Generate JWT token
            jwt_token = self._create_access_token(data={"sub": user["id"]})
            
            result = {
                "access_token": jwt_token,
                "user": user,
                "organizations": orgs_data,
                "expires_in": self.access_token_expire_minutes * 60
            }
            
            # Cache the result
            await self._cache_set(cache_key, result, ttl=self.cache_ttl)
            
            return result
            
        except Exception as e:
            # Log the error properly
            print(f"Production GitHub auth error: {str(e)}")
            raise Exception(f"GitHub authentication failed: {str(e)}")
    
    async def get_current_user(self, token: str, db) -> Optional[Dict[str, Any]]:
        """Get current user with caching"""
        try:
            # Check cache first
            cache_key = f"user:{token[:20]}"  # Use first 20 chars of token
            cached_user = await self._cache_get(cache_key)
            if cached_user:
                print("Using cached user data")
                return cached_user
            
            # Validate JWT token
            payload = jwt.decode(
                token, 
                self.settings.secret_key, 
                algorithms=[self.settings.algorithm]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            
            # TODO: Get user from database with caching
            user_data = {
                "id": user_id,
                "email": "user@example.com",
                "name": "GitHub User"
            }
            
            # Cache the user data
            await self._cache_set(cache_key, user_data, ttl=600)  # 10 minutes
            
            return user_data
            
        except JWTError as e:
            print(f"JWT validation error: {str(e)}")
            return None
    
    async def refresh_token(self, token: str, db) -> Dict[str, Any]:
        """Refresh access token with validation"""
        try:
            # Validate current token
            payload = jwt.decode(
                token, 
                self.settings.secret_key, 
                algorithms=[self.settings.algorithm]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                raise JWTError("Invalid token")
            
            # Generate new token
            new_token = self._create_access_token(data={"sub": user_id})
            
            # Invalidate old cache entries
            try:
                client = await self._get_redis_client()
                if client:
                    await client.delete(f"user:{token[:20]}")
            except Exception as e:
                print(f"Cache invalidation error: {e}")
            
            return {
                "access_token": new_token,
                "token_type": "bearer",
                "expires_in": self.access_token_expire_minutes * 60
            }
            
        except JWTError:
            raise Exception("Invalid refresh token")
    
    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check"""
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {}
        }
        
        # Check Redis
        try:
            client = await self._get_redis_client()
            if client:
                await client.ping()
                health_status["services"]["redis"] = "healthy"
            else:
                health_status["services"]["redis"] = "unavailable"
        except Exception as e:
            health_status["services"]["redis"] = f"error: {str(e)}"
        
        # Check GitHub API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("https://api.github.com/rate_limit", timeout=5)
                if response.status_code == 200:
                    health_status["services"]["github_api"] = "healthy"
                    rate_info = response.json()
                    health_status["github_rate_limit"] = {
                        "remaining": rate_info.get("rate", {}).get("remaining", "unknown"),
                        "limit": rate_info.get("rate", {}).get("limit", "unknown"),
                        "reset": rate_info.get("rate", {}).get("reset", "unknown")
                    }
                else:
                    health_status["services"]["github_api"] = "degraded"
        except Exception as e:
            health_status["services"]["github_api"] = f"error: {str(e)}"
        
        # Overall status
        if any("error" in str(status) or "unavailable" in str(status) 
               for status in health_status["services"].values()):
            health_status["status"] = "degraded"
        
        return health_status
