"""
API v1 Router - Main router that includes all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, clients

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])

# More routers will be added as we create them:
# api_router.include_router(pitches.router, prefix="/pitches", tags=["Pitches"])
# api_router.include_router(job_descriptions.router, prefix="/jds", tags=["Job Descriptions"])
# api_router.include_router(candidates.router, prefix="/candidates", tags=["Candidates"])
# api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
# api_router.include_router(interviews.router, prefix="/interviews", tags=["Interviews"])
# api_router.include_router(offers.router, prefix="/offers", tags=["Offers"])
# api_router.include_router(joinings.router, prefix="/joinings", tags=["Joinings"])
