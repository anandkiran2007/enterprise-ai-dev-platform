"""
Rate limiting middleware for GitHub OAuth and API calls
"""

import time
import asyncio
from typing import Dict, Optional
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class GitHubRateLimiter:
    """Rate limiter specifically for GitHub OAuth endpoints"""
    
    def __init__(self, max_requests: int = 5, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}
    
    def is_allowed(self, client_id: str) -> bool:
        """Check if client is allowed to make a request"""
        current_time = time.time()
        
        # Clean old requests
        if client_id in self.requests:
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id]
                if current_time - req_time < self.window_seconds
            ]
        else:
            self.requests[client_id] = []
        
        # Check if under limit
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[client_id].append(current_time)
        return True
    
    def get_remaining_requests(self, client_id: str) -> int:
        """Get remaining requests for client"""
        if client_id not in self.requests:
            return self.max_requests
        
        current_time = time.time()
        valid_requests = [
            req_time for req_time in self.requests[client_id]
            if current_time - req_time < self.window_seconds
        ]
        
        return max(0, self.max_requests - len(valid_requests))
    
    def get_reset_time(self, client_id: str) -> Optional[int]:
        """Get time when rate limit resets"""
        if client_id not in self.requests or not self.requests[client_id]:
            return None
        
        oldest_request = min(self.requests[client_id])
        return int(oldest_request + self.window_seconds)


class GitHubOAuthRateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for GitHub OAuth endpoints"""
    
    def __init__(self, app, max_requests: int = 5, window_seconds: int = 60):
        super().__init__(app)
        self.rate_limiter = GitHubRateLimiter(max_requests, window_seconds)
    
    async def dispatch(self, request: Request, call_next):
        # Only apply to GitHub OAuth endpoints
        if not request.url.path.startswith('/api/auth/github'):
            return await call_next(request)
        
        # Get client identifier (IP address or user agent)
        client_id = self._get_client_id(request)
        
        # Check rate limit
        if not self.rate_limiter.is_allowed(client_id):
            remaining = self.rate_limiter.get_remaining_requests(client_id)
            reset_time = self.rate_limiter.get_reset_time(client_id)
            
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Too many GitHub OAuth attempts. Please wait before trying again.",
                    "remaining_requests": remaining,
                    "reset_time": reset_time,
                    "retry_after": self.rate_limiter.window_seconds
                },
                headers={
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(reset_time or ""),
                    "Retry-After": str(self.rate_limiter.window_seconds)
                }
            )
        
        # Add rate limit headers to successful requests
        remaining = self.rate_limiter.get_remaining_requests(client_id)
        reset_time = self.rate_limiter.get_reset_time(client_id)
        
        response = await call_next(request)
        
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time or "")
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier"""
        # Use combination of IP and user agent for better identification
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Create hash for privacy
        import hashlib
        client_string = f"{client_ip}:{user_agent}"
        return hashlib.md5(client_string.encode()).hexdigest()[:16]


class SessionRateLimiter:
    """Rate limiter for session-based requests"""
    
    def __init__(self):
        self.sessions: Dict[str, Dict] = {}
    
    def is_allowed(self, session_id: str, endpoint: str, max_requests: int = 10, window_seconds: int = 300) -> bool:
        """Check if session is allowed for specific endpoint"""
        current_time = time.time()
        
        if session_id not in self.sessions:
            self.sessions[session_id] = {}
        
        if endpoint not in self.sessions[session_id]:
            self.sessions[session_id][endpoint] = []
        
        # Clean old requests
        self.sessions[session_id][endpoint] = [
            req_time for req_time in self.sessions[session_id][endpoint]
            if current_time - req_time < window_seconds
        ]
        
        # Check if under limit
        if len(self.sessions[session_id][endpoint]) >= max_requests:
            return False
        
        # Add current request
        self.sessions[session_id][endpoint].append(current_time)
        return True


class SessionRateLimitMiddleware(BaseHTTPMiddleware):
    """Session-based rate limiting middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.session_limiter = SessionRateLimiter()
    
    async def dispatch(self, request: Request, call_next):
        # Get session ID from cookie or header
        session_id = request.cookies.get("session_id") or request.headers.get("X-Session-ID")
        
        if not session_id:
            # Generate new session ID
            import uuid
            session_id = str(uuid.uuid4())
        
        # Check rate limit for sensitive endpoints
        sensitive_endpoints = ['/api/auth/github', '/api/auth/me']
        
        for endpoint in sensitive_endpoints:
            if request.url.path.startswith(endpoint):
                if not self.session_limiter.is_allowed(session_id, endpoint):
                    return JSONResponse(
                        status_code=429,
                        content={
                            "error": "Rate limit exceeded",
                            "message": "Too many requests. Please wait before trying again.",
                            "retry_after": 300
                        },
                        headers={"Retry-After": "300"}
                    )
                break
        
        response = await call_next(request)
        
        # Add session ID to response if new
        if not request.cookies.get("session_id"):
            response.set_cookie(
                key="session_id",
                value=session_id,
                max_age=86400,  # 24 hours
                httponly=True,
                samesite="lax"
            )
        
        return response
