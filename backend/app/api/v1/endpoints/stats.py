"""
Dashboard & Analytics endpoints - COMPLETE
Create as: backend/app/api/v1/endpoints/stats.py
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from typing import Optional
from datetime import datetime, date, timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.client import Client
from app.models.candidate import Candidate
from app.models.job_description import JobDescription, JDStatus
from app.models.application import Application, ApplicationStatus
from app.models.interview import Interview, InterviewStatus
from app.models.offer import Offer, OfferStatus
from app.models.joining import Joining, JoiningStatus
from app.models.pitch import Pitch, PitchStatus
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker
from pydantic import BaseModel


router = APIRouter()


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class OverviewStats(BaseModel):
    total_clients: int
    active_clients: int
    total_candidates: int
    candidates_this_month: int
    active_jds: int
    total_jds: int
    active_applications: int
    total_applications: int
    interviews_today: int
    interviews_this_week: int
    pending_offers: int
    accepted_offers: int
    upcoming_joinings: int
    joinings_this_month: int


class PipelineStats(BaseModel):
    sourced: int
    screened: int
    submitted: int
    interviewing: int
    offered: int
    joined: int
    rejected: int
    withdrawn: int


class MonthlyTrend(BaseModel):
    month: str
    applications: int
    interviews: int
    offers: int
    joinings: int


class ClientPerformance(BaseModel):
    client_id: int
    client_name: str
    active_jds: int
    total_applications: int
    offers_made: int
    positions_filled: int
    success_rate: float


class RecentActivity(BaseModel):
    type: str  # 'candidate', 'application', 'interview', 'offer', 'joining'
    title: str
    description: str
    timestamp: datetime
    related_id: int


class Alert(BaseModel):
    type: str  # 'sla_breach', 'expiring_offer', 'interview_today', 'urgent_jd'
    title: str
    description: str
    severity: str  # 'high', 'medium', 'low'
    count: int


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/overview", response_model=OverviewStats)
async def get_overview_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """Get overview statistics for dashboard."""
    
    today = date.today()
    month_start = date(today.year, today.month, 1)
    week_start = today - timedelta(days=today.weekday())
    
    # Clients
    total_clients = db.query(Client).count()
    active_clients = db.query(Client).filter(Client.status == 'active').count()
    
    # Candidates
    total_candidates = db.query(Candidate).count()
    candidates_this_month = db.query(Candidate).filter(
        Candidate.created_at >= month_start
    ).count()
    
    # JDs
    active_jds = db.query(JobDescription).filter(
        JobDescription.status == JDStatus.OPEN
    ).count()
    total_jds = db.query(JobDescription).count()
    
    # Applications
    active_applications = db.query(Application).filter(
        Application.status.in_([
            ApplicationStatus.SOURCED,
            ApplicationStatus.SCREENED,
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INTERVIEWING
        ])
    ).count()
    total_applications = db.query(Application).count()
    
    # Interviews
    interviews_today = db.query(Interview).filter(
        func.date(Interview.scheduled_date) == today,
        Interview.status == InterviewStatus.SCHEDULED
    ).count()
    
    interviews_this_week = db.query(Interview).filter(
        func.date(Interview.scheduled_date) >= week_start,
        func.date(Interview.scheduled_date) <= today + timedelta(days=7-today.weekday()),
        Interview.status == InterviewStatus.SCHEDULED
    ).count()
    
    # Offers
    pending_offers = db.query(Offer).filter(
        Offer.status.in_([OfferStatus.DRAFT, OfferStatus.SENT])
    ).count()
    
    accepted_offers = db.query(Offer).filter(
        Offer.status == OfferStatus.ACCEPTED
    ).count()
    
    # Joinings
    upcoming_joinings = db.query(Joining).filter(
        Joining.expected_joining_date >= today,
        Joining.status == JoiningStatus.CONFIRMED
    ).count()
    
    joinings_this_month = db.query(Joining).filter(
        func.date(Joining.actual_joining_date) >= month_start,
        Joining.actual_joining_date.isnot(None)
    ).count()
    
    return OverviewStats(
        total_clients=total_clients,
        active_clients=active_clients,
        total_candidates=total_candidates,
        candidates_this_month=candidates_this_month,
        active_jds=active_jds,
        total_jds=total_jds,
        active_applications=active_applications,
        total_applications=total_applications,
        interviews_today=interviews_today,
        interviews_this_week=interviews_this_week,
        pending_offers=pending_offers,
        accepted_offers=accepted_offers,
        upcoming_joinings=upcoming_joinings,
        joinings_this_month=joinings_this_month
    )


@router.get("/pipeline", response_model=PipelineStats)
async def get_pipeline_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """Get recruitment pipeline statistics."""
    
    sourced = db.query(Application).filter(
        Application.status == ApplicationStatus.SOURCED
    ).count()
    
    screened = db.query(Application).filter(
        Application.status == ApplicationStatus.SCREENED
    ).count()
    
    submitted = db.query(Application).filter(
        Application.status == ApplicationStatus.SUBMITTED
    ).count()
    
    interviewing = db.query(Application).filter(
        Application.status == ApplicationStatus.INTERVIEWING
    ).count()
    
    offered = db.query(Application).filter(
        Application.status == ApplicationStatus.OFFERED
    ).count()
    
    joined = db.query(Application).filter(
        Application.status == ApplicationStatus.JOINED
    ).count()
    
    rejected = db.query(Application).filter(
        Application.status == ApplicationStatus.REJECTED
    ).count()
    
    withdrawn = db.query(Application).filter(
        Application.status == ApplicationStatus.WITHDRAWN
    ).count()
    
    return PipelineStats(
        sourced=sourced,
        screened=screened,
        submitted=submitted,
        interviewing=interviewing,
        offered=offered,
        joined=joined,
        rejected=rejected,
        withdrawn=withdrawn
    )


@router.get("/trends/monthly", response_model=list[MonthlyTrend])
async def get_monthly_trends(
    months: int = Query(6, ge=1, le=12, description="Number of months"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """Get monthly trends for last N months."""
    
    trends = []
    today = date.today()
    
    for i in range(months - 1, -1, -1):
        # Calculate month start and end
        if i == 0:
            month_start = date(today.year, today.month, 1)
            month_end = today
        else:
            target_date = today - timedelta(days=30 * i)
            month_start = date(target_date.year, target_date.month, 1)
            if target_date.month == 12:
                month_end = date(target_date.year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(target_date.year, target_date.month + 1, 1) - timedelta(days=1)
        
        # Count stats for this month
        applications = db.query(Application).filter(
            func.date(Application.created_at) >= month_start,
            func.date(Application.created_at) <= month_end
        ).count()
        
        interviews = db.query(Interview).filter(
            func.date(Interview.created_at) >= month_start,
            func.date(Interview.created_at) <= month_end
        ).count()
        
        offers = db.query(Offer).filter(
            func.date(Offer.created_at) >= month_start,
            func.date(Offer.created_at) <= month_end
        ).count()
        
        joinings = db.query(Joining).filter(
            func.date(Joining.created_at) >= month_start,
            func.date(Joining.created_at) <= month_end
        ).count()
        
        trends.append(MonthlyTrend(
            month=month_start.strftime("%b %Y"),
            applications=applications,
            interviews=interviews,
            offers=offers,
            joinings=joinings
        ))
    
    return trends


@router.get("/clients/performance", response_model=list[ClientPerformance])
async def get_client_performance(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """Get top performing clients."""
    
    # Get clients with their stats
    clients = db.query(Client).filter(Client.status == 'active').limit(limit).all()
    
    performance = []
    for client in clients:
        active_jds = db.query(JobDescription).filter(
            JobDescription.client_id == client.id,
            JobDescription.status == JDStatus.OPEN
        ).count()
        
        total_applications = db.query(Application).join(JobDescription).filter(
            JobDescription.client_id == client.id
        ).count()
        
        offers_made = db.query(Offer).join(Application).join(JobDescription).filter(
            JobDescription.client_id == client.id
        ).count()
        
        positions_filled = db.query(Joining).join(Application).join(JobDescription).filter(
            JobDescription.client_id == client.id,
            Joining.status.in_([JoiningStatus.CONFIRMED])
        ).count()
        
        success_rate = (positions_filled / total_applications * 100) if total_applications > 0 else 0
        
        performance.append(ClientPerformance(
            client_id=client.id,
            client_name=client.company_name,
            active_jds=active_jds,
            total_applications=total_applications,
            offers_made=offers_made,
            positions_filled=positions_filled,
            success_rate=round(success_rate, 2)
        ))
    
    # Sort by positions filled
    performance.sort(key=lambda x: x.positions_filled, reverse=True)
    
    return performance


@router.get("/alerts", response_model=list[Alert])
async def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """Get dashboard alerts."""
    
    alerts = []
    today = date.today()
    
    # SLA breached applications
    sla_breached = db.query(Application).filter(
        Application.sla_status == 'breached'
    ).count()
    
    if sla_breached > 0:
        alerts.append(Alert(
            type='sla_breach',
            title='SLA Breached',
            description=f'{sla_breached} applications exceeded SLA deadline',
            severity='high',
            count=sla_breached
        ))
    
    # Interviews today
    interviews_today = db.query(Interview).filter(
        func.date(Interview.scheduled_date) == today,
        Interview.status == InterviewStatus.SCHEDULED
    ).count()
    
    if interviews_today > 0:
        alerts.append(Alert(
            type='interview_today',
            title='Interviews Today',
            description=f'{interviews_today} interviews scheduled for today',
            severity='medium',
            count=interviews_today
        ))
    
    # Expiring offers (next 2 days)
    expiring_offers = db.query(Offer).filter(
        Offer.offer_valid_till <= today + timedelta(days=2),
        Offer.offer_valid_till >= today,
        Offer.status == OfferStatus.SENT
    ).count()
    
    if expiring_offers > 0:
        alerts.append(Alert(
            type='expiring_offer',
            title='Offers Expiring Soon',
            description=f'{expiring_offers} offers expiring in 2 days',
            severity='medium',
            count=expiring_offers
        ))
    
    # Urgent JDs
    urgent_jds = db.query(JobDescription).filter(
        JobDescription.status == JDStatus.OPEN,
        JobDescription.priority == 'urgent'
    ).count()
    
    if urgent_jds > 0:
        alerts.append(Alert(
            type='urgent_jd',
            title='Urgent Job Descriptions',
            description=f'{urgent_jds} urgent JDs need attention',
            severity='high',
            count=urgent_jds
        ))
    
    return alerts


@router.get("/recent-activity", response_model=list[RecentActivity])
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """Get recent activity across the system."""
    
    activities = []
    
    # Recent candidates (last 5)
    recent_candidates = db.query(Candidate).order_by(
        Candidate.created_at.desc()
    ).limit(5).all()
    
    for candidate in recent_candidates:
        activities.append(RecentActivity(
            type='candidate',
            title='New candidate added',
            description=f'{candidate.first_name} {candidate.last_name} - {candidate.current_designation or "N/A"}',
            timestamp=candidate.created_at,
            related_id=candidate.id
        ))
    
    # Recent interviews (last 5)
    recent_interviews = db.query(Interview).order_by(
        Interview.created_at.desc()
    ).limit(5).all()
    
    for interview in recent_interviews:
        activities.append(RecentActivity(
            type='interview',
            title='Interview scheduled',
            description=f'{interview.round_name} - Application #{interview.application_id}',
            timestamp=interview.created_at,
            related_id=interview.id
        ))
    
    # Sort all activities by timestamp and limit
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    
    return activities[:limit]
