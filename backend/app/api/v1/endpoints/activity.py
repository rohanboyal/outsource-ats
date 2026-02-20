# backend/app/api/v1/endpoints/activity.py
"""
Activity Dashboard - Track recent actions and online users
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.application import Application
from app.models.interview import Interview
from app.api.deps import get_current_user

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ActivityItem(BaseModel):
    id: int
    type: str  # 'candidate', 'application', 'interview', etc.
    action: str  # 'created', 'updated', 'deleted'
    title: str
    description: str
    user_name: str
    user_role: str
    created_at: str


class OnlineUser(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    last_login: Optional[str]


class ActivityStats(BaseModel):
    today_candidates: int
    today_applications: int
    today_interviews: int
    online_users: int


class ActivityDashboardResponse(BaseModel):
    stats: ActivityStats
    recent_activity: List[ActivityItem]
    online_users: List[OnlineUser]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/activity/dashboard", response_model=ActivityDashboardResponse)
async def get_activity_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get activity dashboard with recent activity and stats."""
    
    # Get today's date range
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get stats
    today_candidates = db.query(Candidate).filter(
        Candidate.created_at >= today_start
    ).count()
    
    today_applications = db.query(Application).filter(
        Application.created_at >= today_start
    ).count()
    
    today_interviews = db.query(Interview).filter(
        Interview.created_at >= today_start
    ).count()
    
    # Get online users (logged in within last 30 minutes)
    online_threshold = datetime.now() - timedelta(minutes=30)
    online_users_query = db.query(User).filter(
        User.last_login >= online_threshold,
        User.is_active == True
    ).all()
    
    online_users = [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
            "last_login": u.last_login.isoformat() if u.last_login else None
        }
        for u in online_users_query
    ]
    
    # Get recent activity (last 20 items)
    recent_activity = []
    
    # Recent candidates
    recent_candidates = db.query(Candidate).order_by(
        desc(Candidate.created_at)
    ).limit(5).all()
    
    for candidate in recent_candidates:
        creator = db.query(User).filter(User.id == candidate.created_by).first()
        if creator:
            recent_activity.append({
                "id": candidate.id,
                "type": "candidate",
                "action": "created",
                "title": f"New Candidate: {candidate.full_name}",
                "description": f"{candidate.email} - {candidate.current_position or 'N/A'}",
                "user_name": creator.full_name,
                "user_role": creator.role.value if hasattr(creator.role, 'value') else str(creator.role),
                "created_at": candidate.created_at.isoformat()
            })
    
    # Recent applications
    recent_applications = db.query(Application).order_by(
        desc(Application.created_at)
    ).limit(5).all()
    
    for app in recent_applications:
        creator = db.query(User).filter(User.id == app.created_by).first()
        candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
        if creator and candidate:
            recent_activity.append({
                "id": app.id,
                "type": "application",
                "action": "created",
                "title": f"New Application: {candidate.full_name}",
                "description": f"Status: {app.status}",
                "user_name": creator.full_name,
                "user_role": creator.role.value if hasattr(creator.role, 'value') else str(creator.role),
                "created_at": app.created_at.isoformat()
            })
    
    # Recent interviews
    recent_interviews = db.query(Interview).order_by(
        desc(Interview.created_at)
    ).limit(5).all()
    
    for interview in recent_interviews:
        creator = db.query(User).filter(User.id == interview.created_by).first()
        candidate = db.query(Candidate).filter(
            Candidate.id == db.query(Application).filter(
                Application.id == interview.application_id
            ).first().candidate_id
        ).first() if db.query(Application).filter(Application.id == interview.application_id).first() else None
        
        if creator and candidate:
            recent_activity.append({
                "id": interview.id,
                "type": "interview",
                "action": "created",
                "title": f"Interview Scheduled: {candidate.full_name}",
                "description": f"{interview.interview_type} on {interview.scheduled_at.strftime('%Y-%m-%d %H:%M')}",
                "user_name": creator.full_name,
                "user_role": creator.role.value if hasattr(creator.role, 'value') else str(creator.role),
                "created_at": interview.created_at.isoformat()
            })
    
    # Sort by date (most recent first)
    recent_activity.sort(key=lambda x: x["created_at"], reverse=True)
    recent_activity = recent_activity[:20]  # Keep only 20 most recent
    
    return {
        "stats": {
            "today_candidates": today_candidates,
            "today_applications": today_applications,
            "today_interviews": today_interviews,
            "online_users": len(online_users)
        },
        "recent_activity": recent_activity,
        "online_users": online_users
    }


@router.get("/activity/recent", response_model=List[ActivityItem])
async def get_recent_activity(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent activity only."""
    recent_activity = []
    
    # Same logic as above but simplified
    recent_candidates = db.query(Candidate).order_by(
        desc(Candidate.created_at)
    ).limit(limit).all()
    
    for candidate in recent_candidates:
        creator = db.query(User).filter(User.id == candidate.created_by).first()
        if creator:
            recent_activity.append({
                "id": candidate.id,
                "type": "candidate",
                "action": "created",
                "title": f"New Candidate: {candidate.full_name}",
                "description": f"{candidate.email}",
                "user_name": creator.full_name,
                "user_role": creator.role.value if hasattr(creator.role, 'value') else str(creator.role),
                "created_at": candidate.created_at.isoformat()
            })
    
    recent_activity.sort(key=lambda x: x["created_at"], reverse=True)
    return recent_activity[:limit]
