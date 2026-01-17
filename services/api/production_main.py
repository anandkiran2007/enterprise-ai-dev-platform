"""
Production-ready FastAPI application with comprehensive error handling
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .config.production import get_production_settings
from .middleware import LoggingMiddleware, RateLimitMiddleware, setup_error_handlers
from .middleware.rate_limit import GitHubOAuthRateLimitMiddleware, SessionRateLimitMiddleware
from .routers import auth, organizations, projects, repositories, features, agents, integration
from .services.production_auth import ProductionAuthService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    settings = get_production_settings()
    
    # Startup
    logger.info(f"Starting {settings.environment} environment")
    await init_db()
    
    # Initialize production services
    auth_service = ProductionAuthService()
    
    # Store in app state for dependency injection
    app.state.auth_service = auth_service
    app.state.settings = settings
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Application shutdown complete")


def create_production_app() -> FastAPI:
    """Create production-ready FastAPI application"""
    settings = get_production_settings()
    
    app = FastAPI(
        title="Enterprise AI Development Platform",
        description="AI-powered development platform for enterprise multi-repo systems",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url="/redoc" if settings.environment != "production" else None
    )
    
    # CORS middleware with production settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.dashboard_url.split(",") if settings.environment == "production" else ["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    
    # Add production middleware
    app.add_middleware(
        LoggingMiddleware
    )
    
    # Add GitHub OAuth rate limiting (5 requests per minute per client)
    app.add_middleware(
        GitHubOAuthRateLimitMiddleware,
        max_requests=5,
        window_seconds=60
    )
    
    # Add session-based rate limiting
    app.add_middleware(
        SessionRateLimitMiddleware
    )
    
    # Add general rate limiting (100 requests per minute per IP)
    app.add_middleware(
        RateLimitMiddleware,
        calls=100,
        period=60
    )
    
    # Setup error handlers
    setup_error_handlers(app)
    
    # Include routers
    app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
    app.include_router(organizations.router, prefix="/api/organizations", tags=["organizations"])
    app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
    app.include_router(repositories.router, prefix="/api/repositories", tags=["repositories"])
    app.include_router(features.router, prefix="/api/features", tags=["features"])
    app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
    app.include_router(integration.router, prefix="/api/integration", tags=["integration"])
    
    # Production endpoints
    @app.get("/")
    async def root():
        return {
            "message": "Enterprise AI Development Platform API",
            "version": "1.0.0",
            "environment": settings.environment,
            "status": "running"
        }
    
    @app.get("/health")
    async def health_check():
        """Basic health check"""
        return {"status": "healthy", "service": "api-gateway"}
    
    @app.get("/api/health")
    async def api_health_check():
        """API health check through proxy"""
        return {"status": "healthy", "service": "api-gateway"}
    
    @app.get("/api/health/detailed")
    async def detailed_health_check():
        """Detailed health check with service status"""
        auth_service = ProductionAuthService()
        return await auth_service.health_check()
    
    @app.get("/api/test")
    async def test_endpoint():
        """Simple test endpoint"""
        return {
            "message": "Test endpoint working",
            "timestamp": "2026-01-17T07:00:00Z",
            "environment": settings.environment
        }
    
    return app


# Create the application
app = create_production_app()

if __name__ == "__main__":
    import uvicorn
    
    settings = get_production_settings()
    
    # Production uvicorn configuration
    uvicorn.run(
        "services.api.production_main:app",
        host="0.0.0.0",
        port=8000,
        workers=4 if settings.environment == "production" else 1,
        access_log=True,
        use_colors=False,
        log_level=settings.log_level.lower()
    )
