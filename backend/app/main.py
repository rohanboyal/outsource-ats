"""
Main FastAPI application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.api.v1.router import api_router

from app.api.v1.endpoints import setup, team_users
from app.api.v1.endpoints import profile, activity


# ------------------------------------------------------------------
# Create FastAPI app
# ------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Applicant Tracking System for Staff Outsourcing",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ------------------------------------------------------------------
# 🔥 CORS MIDDLEWARE (MUST BE BEFORE ROUTERS)
# ------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ✅ now correctly wired
    allow_credentials=True,
    allow_methods=["*"],                  # includes OPTIONS
    allow_headers=["*"],                  # Authorization, Content-Type, etc.
)

# ------------------------------------------------------------------
# Startup / Shutdown
# ------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Environment: {settings.ENVIRONMENT}")


@app.on_event("shutdown")
async def shutdown_event():
    print(f"Shutting down {settings.APP_NAME}")


# ------------------------------------------------------------------
# Health / Root
# ------------------------------------------------------------------
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "operational",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}


# ------------------------------------------------------------------
# API ROUTES (AFTER CORS)
# ------------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")
app.include_router(setup.router, prefix="/api/v1", tags=["setup"])
app.include_router(team_users.router, prefix="/api/v1/admin", tags=["team-users"])
app.include_router(profile.router, prefix="/api/v1", tags=["profile"])
app.include_router(activity.router, prefix="/api/v1", tags=["activity"])

# ------------------------------------------------------------------
# Global exception handler
# ------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc) if settings.DEBUG else "Internal server error",
            "type": type(exc).__name__,
        },
    )


# ------------------------------------------------------------------
# Local dev entrypoint
# ------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
