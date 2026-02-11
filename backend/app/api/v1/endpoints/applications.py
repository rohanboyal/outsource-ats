"""
Application pipeline management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.job_description import JobDescription, JDStatus
from app.models.application import Application, ApplicationStatus, ApplicationStatusHistory, SLAStatus
from app.models.interview import Interview, InterviewStatus
from app.models.offer import Offer
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationDetailResponse,
    ApplicationStatusUpdate,
    ApplicationSubmitToClient,
    ApplicationReject,
    ApplicationStatusHistoryResponse,
    ApplicationPipelineStats,
    ApplicationBulkUpdate
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker


router = APIRouter()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_sla(jd: JobDescription, start_date: date = None) -> tuple:
    """
    Calculate SLA dates and status.
    
    Returns:
        tuple: (sla_start_date, sla_end_date, sla_status)
    """
    if not start_date:
        start_date = date.today()
    
    sla_days = jd.sla_days if jd.sla_days else 7
    sla_end_date = start_date + timedelta(days=sla_days)
    
    # Calculate SLA status
    days_remaining = (sla_end_date - date.today()).days
    
    if days_remaining < 0:
        sla_status = SLAStatus.BREACHED
    elif days_remaining <= 2:
        sla_status = SLAStatus.AT_RISK
    else:
        sla_status = SLAStatus.ON_TRACK
    
    return start_date, sla_end_date, sla_status


def create_status_history(
    application_id: int,
    from_status: Optional[str],
    to_status: str,
    changed_by: int,
    notes: Optional[str],
    db: Session
):
    """Create status history entry."""
    history = ApplicationStatusHistory(
        application_id=application_id,
        from_status=from_status,
        to_status=to_status,
        changed_by=changed_by,
        notes=notes
    )
    db.add(history)


# ============================================================================
# APPLICATION ENDPOINTS
# ============================================================================

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    app_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_APPLICATION))
):
    """
    Create a new application (link candidate to JD).
    
    Permissions required: CREATE_APPLICATION
    """
    # Verify candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == app_data.candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {app_data.candidate_id} not found"
        )
    
    # Verify JD exists and is open
    jd = db.query(JobDescription).filter(JobDescription.id == app_data.jd_id).first()
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {app_data.jd_id} not found"
        )
    
    if jd.status != JDStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot apply to JD with status: {jd.status.value}"
        )
    
    # Check for duplicate application
    existing = db.query(Application).filter(
        Application.candidate_id == app_data.candidate_id,
        Application.jd_id == app_data.jd_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application already exists for this candidate and JD"
        )
    
    # Calculate SLA
    sla_start, sla_end, sla_status = calculate_sla(jd)
    
    # Create application
    new_application = Application(
        candidate_id=app_data.candidate_id,
        jd_id=app_data.jd_id,
        status=app_data.status,
        screening_notes=app_data.screening_notes,
        internal_rating=app_data.internal_rating,
        screened_by=current_user.id if app_data.status == ApplicationStatus.SCREENED else None,
        screened_at=datetime.utcnow() if app_data.status == ApplicationStatus.SCREENED else None,
        sla_start_date=sla_start,
        sla_end_date=sla_end,
        sla_status=sla_status,
        created_by=current_user.id
    )
    
    db.add(new_application)
    db.flush()
    
    # Create status history
    create_status_history(
        application_id=new_application.id,
        from_status=None,
        to_status=app_data.status.value,
        changed_by=current_user.id,
        notes="Application created",
        db=db
    )
    
    db.commit()
    db.refresh(new_application)
    
    return new_application


@router.get("", response_model=ApplicationListResponse)
async def list_applications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    candidate_id: Optional[int] = Query(None, description="Filter by candidate"),
    jd_id: Optional[int] = Query(None, description="Filter by JD"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by status"),
    sla_status: Optional[SLAStatus] = Query(None, description="Filter by SLA status"),
    recruiter_id: Optional[int] = Query(None, description="Filter by recruiter"),
    submitted_only: bool = Query(False, description="Show only submitted applications"),
    include_deleted: bool = Query(False, description="Include soft-deleted applications"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_APPLICATION))
):
    """
    List all applications with pagination and filters.
    
    Permissions required: VIEW_APPLICATION
    """
    # Base query
    query = db.query(Application)
    
    # Filter out deleted applications unless requested
    if not include_deleted:
        query = query.filter(Application.deleted_at.is_(None))
    
    # Apply filters
    if candidate_id:
        query = query.filter(Application.candidate_id == candidate_id)
    
    if jd_id:
        query = query.filter(Application.jd_id == jd_id)
    
    if client_id:
        query = query.join(JobDescription).filter(JobDescription.client_id == client_id)
    
    if status:
        query = query.filter(Application.status == status)
    
    if sla_status:
        query = query.filter(Application.sla_status == sla_status)
    
    if recruiter_id:
        query = query.join(JobDescription).filter(JobDescription.assigned_recruiter_id == recruiter_id)
    
    if submitted_only:
        query = query.filter(Application.submitted_to_client_date.isnot(None))
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results - order by SLA and created date
    applications = query.order_by(
        Application.sla_status.desc(),
        Application.created_at.desc()
    ).offset(offset).limit(page_size).all()
    
    return ApplicationListResponse(
        applications=applications,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
async def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_APPLICATION))
):
    """
    Get application details by ID with full information.
    
    Permissions required: VIEW_APPLICATION
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    # Get candidate info
    candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first()
    
    # Get JD and client info
    jd = db.query(JobDescription).filter(JobDescription.id == application.jd_id).first()
    
    # Get interview statistics
    total_interviews = db.query(func.count(Interview.id)).filter(
        Interview.application_id == application_id
    ).scalar() or 0
    
    completed_interviews = db.query(func.count(Interview.id)).filter(
        Interview.application_id == application_id,
        Interview.status == InterviewStatus.COMPLETED
    ).scalar() or 0
    
    pending_interviews = db.query(func.count(Interview.id)).filter(
        Interview.application_id == application_id,
        Interview.status == InterviewStatus.SCHEDULED
    ).scalar() or 0
    
    offers_count = db.query(func.count(Offer.id)).filter(
        Offer.application_id == application_id
    ).scalar() or 0
    
    # Build detailed response
    response = ApplicationDetailResponse(
        **application.__dict__,
        candidate_name=f"{candidate.first_name} {candidate.last_name}" if candidate else None,
        candidate_email=candidate.email if candidate else None,
        candidate_phone=candidate.phone if candidate else None,
        jd_title=jd.title if jd else None,
        jd_code=jd.jd_code if jd else None,
        client_name=jd.client.company_name if jd and jd.client else None,
        total_interviews=total_interviews,
        completed_interviews=completed_interviews,
        pending_interviews=pending_interviews,
        offers_count=offers_count
    )
    
    return response


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    app_data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_APPLICATION))
):
    """
    Update application information.
    
    Permissions required: UPDATE_APPLICATION
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    # Update fields
    update_data = app_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    
    return application


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_APPLICATION))
):
    """
    Update application status with history tracking.
    
    Permissions required: UPDATE_APPLICATION
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    old_status = application.status.value
    new_status = status_update.status.value
    
    # Update status
    application.status = status_update.status
    
    # Update screened fields if moving to screened
    if status_update.status == ApplicationStatus.SCREENED and not application.screened_at:
        application.screened_by = current_user.id
        application.screened_at = datetime.utcnow()
    
    # Create status history
    create_status_history(
        application_id=application_id,
        from_status=old_status,
        to_status=new_status,
        changed_by=current_user.id,
        notes=status_update.notes,
        db=db
    )
    
    db.commit()
    db.refresh(application)
    
    return application


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
async def submit_to_client(
    application_id: int,
    submission: ApplicationSubmitToClient,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.SUBMIT_APPLICATION))
):
    """
    Submit application to client.
    
    Permissions required: SUBMIT_APPLICATION
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    # Check if already submitted
    if application.submitted_to_client_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application already submitted to client"
        )
    
    # Must be at least screened
    if application.status == ApplicationStatus.SOURCED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application must be screened before submission"
        )
    
    # Update submission details
    old_status = application.status.value
    application.submitted_to_client_date = date.today()
    application.client_submission_notes = submission.submission_notes
    application.status = ApplicationStatus.SUBMITTED
    
    # Create status history
    create_status_history(
        application_id=application_id,
        from_status=old_status,
        to_status=ApplicationStatus.SUBMITTED.value,
        changed_by=current_user.id,
        notes=f"Submitted to client. {submission.submission_notes or ''}",
        db=db
    )
    
    db.commit()
    db.refresh(application)
    
    return application


@router.post("/{application_id}/reject", response_model=ApplicationResponse)
async def reject_application(
    application_id: int,
    rejection: ApplicationReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_APPLICATION))
):
    """
    Reject an application.
    
    Permissions required: UPDATE_APPLICATION
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    old_status = application.status.value
    
    # Update rejection details
    application.status = ApplicationStatus.REJECTED
    application.rejection_reason = rejection.rejection_reason
    application.rejection_stage = rejection.rejection_stage or old_status
    application.rejected_by = f"User {current_user.id}"
    application.rejected_at = datetime.utcnow()
    
    # Create status history
    create_status_history(
        application_id=application_id,
        from_status=old_status,
        to_status=ApplicationStatus.REJECTED.value,
        changed_by=current_user.id,
        notes=f"Rejected: {rejection.rejection_reason}",
        db=db
    )
    
    db.commit()
    db.refresh(application)
    
    return application


@router.get("/{application_id}/history", response_model=List[ApplicationStatusHistoryResponse])
async def get_application_history(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_APPLICATION))
):
    """
    Get application status change history.
    
    Permissions required: VIEW_APPLICATION
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    # Get history with user info
    history = db.query(ApplicationStatusHistory).filter(
        ApplicationStatusHistory.application_id == application_id
    ).order_by(ApplicationStatusHistory.changed_at.desc()).all()
    
    # Add user names
    result = []
    for h in history:
        user = db.query(User).filter(User.id == h.changed_by).first()
        result.append(
            ApplicationStatusHistoryResponse(
                **h.__dict__,
                changed_by_name=user.full_name if user else None
            )
        )
    
    return result


@router.get("/stats/pipeline", response_model=ApplicationPipelineStats)
async def get_pipeline_stats(
    jd_id: Optional[int] = Query(None, description="Filter by JD"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    recruiter_id: Optional[int] = Query(None, description="Filter by recruiter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """
    Get pipeline statistics.
    
    Permissions required: VIEW_REPORTS
    """
    # Base query
    query = db.query(Application)
    
    # Apply filters
    if jd_id:
        query = query.filter(Application.jd_id == jd_id)
    
    if client_id:
        query = query.join(JobDescription).filter(JobDescription.client_id == client_id)
    
    if recruiter_id:
        query = query.join(JobDescription).filter(JobDescription.assigned_recruiter_id == recruiter_id)
    
    # Count by status
    sourced = query.filter(Application.status == ApplicationStatus.SOURCED).count()
    screened = query.filter(Application.status == ApplicationStatus.SCREENED).count()
    submitted = query.filter(Application.status == ApplicationStatus.SUBMITTED).count()
    interviewing = query.filter(Application.status == ApplicationStatus.INTERVIEWING).count()
    offered = query.filter(Application.status == ApplicationStatus.OFFERED).count()
    joined = query.filter(Application.status == ApplicationStatus.JOINED).count()
    rejected = query.filter(Application.status == ApplicationStatus.REJECTED).count()
    withdrawn = query.filter(Application.status == ApplicationStatus.WITHDRAWN).count()
    
    total = query.count()
    
    # Calculate conversion rates
    screening_to_submission = (submitted / screened * 100) if screened > 0 else 0
    submission_to_interview = (interviewing / submitted * 100) if submitted > 0 else 0
    interview_to_offer = (offered / interviewing * 100) if interviewing > 0 else 0
    offer_to_joining = (joined / offered * 100) if offered > 0 else 0
    
    return ApplicationPipelineStats(
        sourced=sourced,
        screened=screened,
        submitted=submitted,
        interviewing=interviewing,
        offered=offered,
        joined=joined,
        rejected=rejected,
        withdrawn=withdrawn,
        total=total,
        screening_to_submission_rate=round(screening_to_submission, 2),
        submission_to_interview_rate=round(submission_to_interview, 2),
        interview_to_offer_rate=round(interview_to_offer, 2),
        offer_to_joining_rate=round(offer_to_joining, 2)
    )


@router.post("/bulk-update", response_model=dict)
async def bulk_update_status(
    bulk_update: ApplicationBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_APPLICATION))
):
    """
    Bulk update application status.
    
    Permissions required: UPDATE_APPLICATION
    """
    updated_count = 0
    errors = []
    
    for app_id in bulk_update.application_ids:
        try:
            application = db.query(Application).filter(Application.id == app_id).first()
            
            if not application:
                errors.append(f"Application {app_id} not found")
                continue
            
            old_status = application.status.value
            application.status = bulk_update.status
            
            # Create status history
            create_status_history(
                application_id=app_id,
                from_status=old_status,
                to_status=bulk_update.status.value,
                changed_by=current_user.id,
                notes=bulk_update.notes,
                db=db
            )
            
            updated_count += 1
            
        except Exception as e:
            errors.append(f"Application {app_id}: {str(e)}")
    
    db.commit()
    
    return {
        "updated": updated_count,
        "total": len(bulk_update.application_ids),
        "errors": errors
    }


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_APPLICATION))
):
    """
    Delete application (soft delete).
    
    Permissions required: DELETE_APPLICATION
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    # Soft delete
    application.deleted_at = datetime.utcnow()
    
    db.commit()
    
    return None
