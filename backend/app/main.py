"""
Main FastAPI application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.db.base import init_db
from app.api.v1.router import api_router


# Create FastAPI app instance
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Applicant Tracking System for Staff Outsourcing",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Environment: {settings.ENVIRONMENT}")
    
    # Initialize database (create tables if they don't exist)
    # Note: In production, use Alembic migrations instead
    if settings.DEBUG:
        # init_db()  # Uncomment when ready to create tables
        pass


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    print(f"Shutting down {settings.APP_NAME}")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - health check."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "operational"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }


# Include API router
app.include_router(api_router, prefix="/api/v1")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc) if settings.DEBUG else "Internal server error",
            "type": type(exc).__name__
        }
    )


if __name__ == "__main__":
    # Run with: python app/main.py
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
