"""
Interview management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, date

from app.db.session import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus
from app.models.job_description import JobDescription
from app.models.interview import Interview, InterviewStatus, InterviewResult, InterviewMode
from app.schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    InterviewListResponse,
    InterviewDetailResponse,
    InterviewFeedback,
    InterviewReschedule,
    InterviewStats
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker


router = APIRouter()


# ============================================================================
# INTERVIEW ENDPOINTS
# ============================================================================

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_INTERVIEW))
):
    """
    Schedule a new interview.
    
    Permissions required: CREATE_INTERVIEW
    """
    # Verify application exists
    application = db.query(Application).filter(
        Application.id == interview_data.application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {interview_data.application_id} not found"
        )
    
    # Check if application is in valid status for interview
    valid_statuses = [
        ApplicationStatus.SCREENED,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.INTERVIEWING
    ]
    
    if application.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot schedule interview for application with status: {application.status.value}"
        )
    
    # Create interview
    new_interview = Interview(
        application_id=interview_data.application_id,
        round_number=interview_data.round_number,
        round_name=interview_data.round_name,
        scheduled_date=interview_data.scheduled_date,
        duration_minutes=interview_data.duration_minutes,
        interviewer_name=interview_data.interviewer_name,
        interviewer_email=interview_data.interviewer_email,
        interviewer_designation=interview_data.interviewer_designation,
        is_client_interview=interview_data.is_client_interview,
        interview_mode=interview_data.interview_mode,
        meeting_link=interview_data.meeting_link,
        location=interview_data.location,
        status=InterviewStatus.SCHEDULED,
        next_round_scheduled=False,
        additional_notes=interview_data.additional_notes,
        created_by=current_user.id
    )
    
    db.add(new_interview)
    
    # Update application status to INTERVIEWING if not already
    if application.status != ApplicationStatus.INTERVIEWING:
        application.status = ApplicationStatus.INTERVIEWING
    
    db.commit()
    db.refresh(new_interview)
    
    return new_interview


@router.get("", response_model=InterviewListResponse)
async def list_interviews(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    application_id: Optional[int] = Query(None, description="Filter by application"),
    candidate_id: Optional[int] = Query(None, description="Filter by candidate"),
    jd_id: Optional[int] = Query(None, description="Filter by JD"),
    status: Optional[InterviewStatus] = Query(None, description="Filter by status"),
    result: Optional[InterviewResult] = Query(None, description="Filter by result"),
    interviewer_email: Optional[str] = Query(None, description="Filter by interviewer email"),
    scheduled_from: Optional[date] = Query(None, description="Scheduled from date"),
    scheduled_to: Optional[date] = Query(None, description="Scheduled to date"),
    is_client_interview: Optional[bool] = Query(None, description="Filter client interviews"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_INTERVIEW))
):
    """
    List all interviews with pagination and filters.
    
    Permissions required: VIEW_INTERVIEW
    """
    # Base query
    query = db.query(Interview)
    
    # Apply filters
    if application_id:
        query = query.filter(Interview.application_id == application_id)
    
    if candidate_id:
        query = query.join(Application).filter(Application.candidate_id == candidate_id)
    
    if jd_id:
        query = query.join(Application).filter(Application.jd_id == jd_id)
    
    if status:
        query = query.filter(Interview.status == status)
    
    if result:
        query = query.filter(Interview.result == result)
    
    if interviewer_email:
        query = query.filter(Interview.interviewer_email == interviewer_email)
    
    if scheduled_from:
        query = query.filter(Interview.scheduled_date >= scheduled_from)
    
    if scheduled_to:
        query = query.filter(Interview.scheduled_date <= scheduled_to)
    
    if is_client_interview is not None:
        query = query.filter(Interview.is_client_interview == is_client_interview)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results - order by scheduled date
    interviews = query.order_by(
        Interview.scheduled_date.desc()
    ).offset(offset).limit(page_size).all()
    
    return InterviewListResponse(
        interviews=interviews,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
async def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_INTERVIEW))
):
    """
    Get interview details by ID.
    
    Permissions required: VIEW_INTERVIEW
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID {interview_id} not found"
        )
    
    # Get application, candidate, and JD info
    application = db.query(Application).filter(Application.id == interview.application_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first() if application else None
    jd = db.query(JobDescription).filter(JobDescription.id == application.jd_id).first() if application else None
    
    # Build detailed response
    response = InterviewDetailResponse(
        **interview.__dict__,
        candidate_name=f"{candidate.first_name} {candidate.last_name}" if candidate else None,
        candidate_email=candidate.email if candidate else None,
        jd_title=jd.title if jd else None,
        jd_code=jd.jd_code if jd else None,
        client_name=jd.client.company_name if jd and jd.client else None,
        application_status=application.status.value if application else None
    )
    
    return response


@router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: int,
    interview_data: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_INTERVIEW))
):
    """
    Update interview information.
    
    Permissions required: UPDATE_INTERVIEW
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID {interview_id} not found"
        )
    
    # Update fields
    update_data = interview_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(interview, field, value)
    
    db.commit()
    db.refresh(interview)
    
    return interview


@router.post("/{interview_id}/feedback", response_model=InterviewResponse)
async def submit_feedback(
    interview_id: int,
    feedback_data: InterviewFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.SUBMIT_FEEDBACK))
):
    """
    Submit interview feedback and result.
    
    Permissions required: SUBMIT_FEEDBACK
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID {interview_id} not found"
        )
    
    # Check if interview is completed
    if interview.status != InterviewStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only submit feedback for completed interviews"
        )
    
    # Update feedback
    interview.feedback = feedback_data.feedback
    interview.rating = feedback_data.rating
    interview.strengths = feedback_data.strengths
    interview.weaknesses = feedback_data.weaknesses
    interview.result = feedback_data.result
    interview.next_round_scheduled = feedback_data.next_round_scheduled
    
    db.commit()
    db.refresh(interview)
    
    return interview


@router.patch("/{interview_id}/complete", response_model=InterviewResponse)
async def complete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_INTERVIEW))
):
    """
    Mark interview as completed.
    
    Permissions required: UPDATE_INTERVIEW
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID {interview_id} not found"
        )
    
    if interview.status != InterviewStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only complete scheduled interviews. Current status: {interview.status.value}"
        )
    
    # Mark as completed
    interview.status = InterviewStatus.COMPLETED
    interview.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(interview)
    
    return interview


@router.patch("/{interview_id}/cancel", response_model=InterviewResponse)
async def cancel_interview(
    interview_id: int,
    reason: Optional[str] = Query(None, description="Cancellation reason"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_INTERVIEW))
):
    """
    Cancel an interview.
    
    Permissions required: UPDATE_INTERVIEW
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID {interview_id} not found"
        )
    
    # Cancel interview
    interview.status = InterviewStatus.CANCELLED
    if reason:
        interview.additional_notes = f"Cancelled: {reason}"
    
    db.commit()
    db.refresh(interview)
    
    return interview


@router.post("/{interview_id}/reschedule", response_model=InterviewResponse)
async def reschedule_interview(
    interview_id: int,
    reschedule_data: InterviewReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_INTERVIEW))
):
    """
    Reschedule an interview.
    
    Permissions required: UPDATE_INTERVIEW
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID {interview_id} not found"
        )
    
    if interview.status == InterviewStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reschedule a completed interview"
        )
    
    # Update schedule
    interview.scheduled_date = reschedule_data.new_scheduled_date
    interview.status = InterviewStatus.RESCHEDULED
    
    if reschedule_data.reason:
        interview.additional_notes = f"Rescheduled: {reschedule_data.reason}. {interview.additional_notes or ''}"
    
    db.commit()
    db.refresh(interview)
    
    return interview


@router.get("/stats/overview", response_model=InterviewStats)
async def get_interview_stats(
    jd_id: Optional[int] = Query(None, description="Filter by JD"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    date_from: Optional[date] = Query(None, description="From date"),
    date_to: Optional[date] = Query(None, description="To date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """
    Get interview statistics.
    
    Permissions required: VIEW_REPORTS
    """
    # Base query
    query = db.query(Interview)
    
    # Apply filters
    if jd_id:
        query = query.join(Application).filter(Application.jd_id == jd_id)
    
    if client_id:
        query = query.join(Application).join(JobDescription).filter(
            JobDescription.client_id == client_id
        )
    
    if date_from:
        query = query.filter(Interview.scheduled_date >= date_from)
    
    if date_to:
        query = query.filter(Interview.scheduled_date <= date_to)
    
    # Count by status
    total_scheduled = query.filter(Interview.status == InterviewStatus.SCHEDULED).count()
    total_completed = query.filter(Interview.status == InterviewStatus.COMPLETED).count()
    total_cancelled = query.filter(Interview.status == InterviewStatus.CANCELLED).count()
    total_no_show = query.filter(Interview.status == InterviewStatus.NO_SHOW).count()
    
    # Count by result
    selected_count = query.filter(Interview.result == InterviewResult.SELECTED).count()
    rejected_count = query.filter(Interview.result == InterviewResult.REJECTED).count()
    on_hold_count = query.filter(Interview.result == InterviewResult.ON_HOLD).count()
    pending_count = query.filter(Interview.result == InterviewResult.PENDING).count()
    
    # Calculate average rating
    avg_rating_result = query.filter(Interview.rating.isnot(None)).with_entities(
        func.avg(Interview.rating)
    ).scalar()
    average_rating = float(avg_rating_result) if avg_rating_result else 0.0
    
    # Calculate selection rate
    total_with_result = selected_count + rejected_count + on_hold_count
    selection_rate = (selected_count / total_with_result * 100) if total_with_result > 0 else 0
    
    return InterviewStats(
        total_scheduled=total_scheduled,
        total_completed=total_completed,
        total_cancelled=total_cancelled,
        total_no_show=total_no_show,
        selected_count=selected_count,
        rejected_count=rejected_count,
        on_hold_count=on_hold_count,
        pending_count=pending_count,
        average_rating=round(average_rating, 2),
        selection_rate=round(selection_rate, 2)
    )


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_INTERVIEW))
):
    """
    Delete an interview.
    
    Permissions required: DELETE_INTERVIEW
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID {interview_id} not found"
        )
    
    # Can only delete scheduled interviews that haven't occurred
    if interview.status == InterviewStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete completed interviews"
        )
    
    db.delete(interview)
    db.commit()
    
    return None
