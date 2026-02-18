"""
Client Portal API Endpoints
Create as: backend/app/api/v1/endpoints/client_portal.py

All endpoints are scoped to the logged-in client's data only.
Clients can ONLY see their own company's data.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.client import Client
from app.models.job_description import JobDescription, JDStatus
from app.models.application import Application, ApplicationStatus
from app.models.candidate import Candidate
from app.models.interview import Interview, InterviewStatus
from app.models.offer import Offer
from app.api.deps import get_current_user

router = APIRouter()


# ============================================================================
# DEPENDENCY: Ensure logged-in user is a client role
# ============================================================================

def get_current_client_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> tuple[User, Client]:
    """Verify user is a client role and return their client record."""
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Client portal is for client users only."
        )
    # Find their associated client record via email match or client_id on user
    # We match by email domain or by a client_contact record
    from app.models.client import ClientContact
    contact = db.query(ClientContact).filter(
        ClientContact.email == current_user.email
    ).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No client account linked to this user. Contact your recruiter."
        )
    client = db.query(Client).filter(Client.id == contact.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client account not found."
        )
    return current_user, client


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class ClientDashboardStats(BaseModel):
    total_jds: int
    open_jds: int
    total_candidates_submitted: int
    candidates_pending_review: int
    interviews_scheduled: int
    offers_extended: int
    positions_filled: int


class ClientJDResponse(BaseModel):
    id: int
    jd_code: str
    title: str
    status: str
    priority: str
    open_positions: int
    filled_positions: int
    total_applications: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ClientCandidateResponse(BaseModel):
    application_id: int
    candidate_id: int
    candidate_name: str
    current_designation: Optional[str]
    total_experience: Optional[float]
    current_company: Optional[str]
    skills: Optional[List[str]]
    current_ctc: Optional[float]
    expected_ctc: Optional[float]
    notice_period_days: Optional[int]
    application_status: str
    jd_title: str
    jd_id: int
    submitted_date: Optional[datetime]
    resume_path: Optional[str]
    client_feedback: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class ClientInterviewResponse(BaseModel):
    id: int
    application_id: int
    candidate_name: str
    jd_title: str
    round_name: str
    round_number: int
    scheduled_date: Optional[datetime]
    interview_mode: str
    meeting_link: Optional[str]
    interviewer_name: Optional[str]
    status: str
    result: Optional[str]
    feedback: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class ClientFeedbackRequest(BaseModel):
    feedback: str
    decision: str  # 'approve' | 'reject' | 'hold'
    notes: Optional[str] = None


class ClientInterviewFeedbackRequest(BaseModel):
    feedback: str
    rating: Optional[int] = None  # 1-5
    result: str  # 'selected' | 'rejected' | 'on_hold'


# ============================================================================
# DASHBOARD
# ============================================================================

@router.get("/dashboard", response_model=ClientDashboardStats)
async def get_client_dashboard(
    client_data: tuple = Depends(get_current_client_user),
    db: Session = Depends(get_db)
):
    """Get dashboard stats for the client portal."""
    _, client = client_data

    total_jds = db.query(JobDescription).filter(
        JobDescription.client_id == client.id
    ).count()

    open_jds = db.query(JobDescription).filter(
        JobDescription.client_id == client.id,
        JobDescription.status == JDStatus.OPEN
    ).count()

    # Applications submitted to this client
    submitted_apps = db.query(Application).join(JobDescription).filter(
        JobDescription.client_id == client.id,
        Application.status.in_([
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INTERVIEWING,
            ApplicationStatus.OFFERED,
            ApplicationStatus.JOINED
        ])
    ).count()

    # Pending review (submitted but not yet interviewing)
    pending_review = db.query(Application).join(JobDescription).filter(
        JobDescription.client_id == client.id,
        Application.status == ApplicationStatus.SUBMITTED
    ).count()

    # Interviews scheduled
    interviews = db.query(Interview).join(Application).join(JobDescription).filter(
        JobDescription.client_id == client.id,
        Interview.status == InterviewStatus.SCHEDULED
    ).count()

    # Offers extended
    offers = db.query(Offer).join(Application).join(JobDescription).filter(
        JobDescription.client_id == client.id
    ).count()

    # Positions filled
    filled = db.query(Application).join(JobDescription).filter(
        JobDescription.client_id == client.id,
        Application.status == ApplicationStatus.JOINED
    ).count()

    return ClientDashboardStats(
        total_jds=total_jds,
        open_jds=open_jds,
        total_candidates_submitted=submitted_apps,
        candidates_pending_review=pending_review,
        interviews_scheduled=interviews,
        offers_extended=offers,
        positions_filled=filled
    )


# ============================================================================
# JDs
# ============================================================================

@router.get("/jds", response_model=List[ClientJDResponse])
async def get_client_jds(
    status: Optional[str] = None,
    client_data: tuple = Depends(get_current_client_user),
    db: Session = Depends(get_db)
):
    """Get all JDs for this client."""
    _, client = client_data

    query = db.query(JobDescription).filter(
        JobDescription.client_id == client.id
    )
    if status:
        query = query.filter(JobDescription.status == status)

    jds = query.order_by(JobDescription.created_at.desc()).all()

    result = []
    for jd in jds:
        total_apps = db.query(Application).filter(
            Application.jd_id == jd.id,
            Application.status.in_([
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.INTERVIEWING,
                ApplicationStatus.OFFERED,
                ApplicationStatus.JOINED
            ])
        ).count()

        result.append(ClientJDResponse(
            id=jd.id,
            jd_code=jd.jd_code,
            title=jd.title,
            status=jd.status.value if hasattr(jd.status, 'value') else str(jd.status),
            priority=jd.priority.value if hasattr(jd.priority, 'value') else str(jd.priority),
            open_positions=jd.open_positions,
            filled_positions=jd.filled_positions,
            total_applications=total_apps,
            created_at=jd.created_at,
        ))

    return result


# ============================================================================
# CANDIDATES
# ============================================================================

@router.get("/candidates", response_model=List[ClientCandidateResponse])
async def get_client_candidates(
    jd_id: Optional[int] = None,
    status: Optional[str] = None,
    client_data: tuple = Depends(get_current_client_user),
    db: Session = Depends(get_db)
):
    """Get all candidates submitted to this client."""
    _, client = client_data

    query = db.query(Application, Candidate, JobDescription).join(
        Candidate, Application.candidate_id == Candidate.id
    ).join(
        JobDescription, Application.jd_id == JobDescription.id
    ).filter(
        JobDescription.client_id == client.id,
        Application.status.in_([
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INTERVIEWING,
            ApplicationStatus.OFFERED,
            ApplicationStatus.JOINED,
            ApplicationStatus.REJECTED
        ])
    )

    if jd_id:
        query = query.filter(Application.jd_id == jd_id)
    if status:
        query = query.filter(Application.status == status)

    results = query.order_by(Application.submitted_to_client_date.desc()).all()

    candidates = []
    for app, candidate, jd in results:
        candidates.append(ClientCandidateResponse(
            application_id=app.id,
            candidate_id=candidate.id,
            candidate_name=f"{candidate.first_name} {candidate.last_name}",
            current_designation=candidate.current_designation,
            total_experience=candidate.total_experience,
            current_company=candidate.current_company,
            skills=candidate.skills,
            current_ctc=candidate.current_ctc,
            expected_ctc=candidate.expected_ctc,
            notice_period_days=candidate.notice_period_days,
            application_status=app.status.value if hasattr(app.status, 'value') else str(app.status),
            jd_title=jd.title,
            jd_id=jd.id,
            submitted_date=app.submitted_to_client_date,
            resume_path=candidate.resume_path,
            client_feedback=app.screening_notes,
        ))

    return candidates


@router.post("/candidates/{application_id}/feedback")
async def submit_candidate_feedback(
    application_id: int,
    feedback_data: ClientFeedbackRequest,
    client_data: tuple = Depends(get_current_client_user),
    db: Session = Depends(get_db)
):
    """Client approves, rejects, or holds a candidate."""
    _, client = client_data

    # Verify this application belongs to this client
    app = db.query(Application).join(JobDescription).filter(
        Application.id == application_id,
        JobDescription.client_id == client.id
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Update status based on decision
    app.screening_notes = f"Client feedback: {feedback_data.feedback}"
    if feedback_data.notes:
        app.screening_notes += f"\nNotes: {feedback_data.notes}"

    if feedback_data.decision == 'approve':
        app.status = ApplicationStatus.INTERVIEWING
    elif feedback_data.decision == 'reject':
        app.status = ApplicationStatus.REJECTED
    # 'hold' keeps current status but saves feedback

    db.commit()
    return {"success": True, "message": f"Candidate {feedback_data.decision}d successfully"}


# ============================================================================
# INTERVIEWS
# ============================================================================

@router.get("/interviews", response_model=List[ClientInterviewResponse])
async def get_client_interviews(
    client_data: tuple = Depends(get_current_client_user),
    db: Session = Depends(get_db)
):
    """Get all interviews for this client's candidates."""
    _, client = client_data

    results = db.query(Interview, Application, Candidate, JobDescription).join(
        Application, Interview.application_id == Application.id
    ).join(
        Candidate, Application.candidate_id == Candidate.id
    ).join(
        JobDescription, Application.jd_id == JobDescription.id
    ).filter(
        JobDescription.client_id == client.id
    ).order_by(Interview.scheduled_date.desc()).all()

    interviews = []
    for interview, app, candidate, jd in results:
        interviews.append(ClientInterviewResponse(
            id=interview.id,
            application_id=app.id,
            candidate_name=f"{candidate.first_name} {candidate.last_name}",
            jd_title=jd.title,
            round_name=interview.round_name,
            round_number=interview.round_number,
            scheduled_date=interview.scheduled_date,
            interview_mode=interview.interview_mode.value if hasattr(interview.interview_mode, 'value') else str(interview.interview_mode),
            meeting_link=interview.meeting_link,
            interviewer_name=interview.interviewer_name,
            status=interview.status.value if hasattr(interview.status, 'value') else str(interview.status),
            result=interview.result.value if interview.result and hasattr(interview.result, 'value') else str(interview.result) if interview.result else None,
            feedback=interview.feedback,
        ))

    return interviews


@router.post("/interviews/{interview_id}/feedback")
async def submit_interview_feedback(
    interview_id: int,
    feedback_data: ClientInterviewFeedbackRequest,
    client_data: tuple = Depends(get_current_client_user),
    db: Session = Depends(get_db)
):
    """Client submits feedback for an interview."""
    _, client = client_data

    interview = db.query(Interview).join(Application).join(JobDescription).filter(
        Interview.id == interview_id,
        JobDescription.client_id == client.id
    ).first()

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.feedback = feedback_data.feedback
    if feedback_data.rating:
        interview.rating = feedback_data.rating

    from app.models.interview import InterviewResult
    result_map = {
        'selected': InterviewResult.SELECTED,
        'rejected': InterviewResult.REJECTED,
        'on_hold': InterviewResult.ON_HOLD,
    }
    if feedback_data.result in result_map:
        interview.result = result_map[feedback_data.result]

    db.commit()
    return {"success": True, "message": "Interview feedback submitted successfully"}
