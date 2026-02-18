"""
API v1 Router - Main router that includes all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    clients,
    candidates,
    job_descriptions,
    applications,
    interviews,
    offers,
    joinings,
    pitches,
    stats,
    notifications,
    client_portal,
    client_users_admin
)

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authenticationssss"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["Candidates"])
api_router.include_router(job_descriptions.router, prefix="/jds", tags=["Job Descriptions"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["Interviews"])
api_router.include_router(offers.router, prefix="/offers", tags=["Offers"])
api_router.include_router(joinings.router, prefix="/joinings", tags=["Joinings"])
api_router.include_router(pitches.router, prefix="/pitches", tags=["Pitches"])
api_router.include_router(stats.router, prefix="/stats", tags=["Statistics"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(client_portal.router, prefix="/client-portal", tags=["Client Portal"])
api_router.include_router(client_users_admin.router, prefix="/admin", tags=["Admin"])
# Future routers can be added here:
# api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
# api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
# api_router.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
