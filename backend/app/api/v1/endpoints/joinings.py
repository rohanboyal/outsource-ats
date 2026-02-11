"""
Joining/Onboarding management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus
from app.models.job_description import JobDescription
from app.models.offer import Offer
from app.models.joining import Joining, JoiningStatus
from app.schemas.joining import (
    JoiningCreate,
    JoiningUpdate,
    JoiningResponse,
    JoiningListResponse,
    JoiningDetailResponse,
    JoiningStatusUpdate,
    JoiningDocumentUpdate,
    JoiningBGVUpdate,
    JoiningOnboardingUpdate,
    JoiningNoShow,
    JoiningStats,
    JoiningUpcoming
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker


router = APIRouter()


# ============================================================================
# JOINING ENDPOINTS
# ============================================================================

@router.post("", response_model=JoiningResponse, status_code=status.HTTP_201_CREATED)
async def create_joining(
    joining_data: JoiningCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_JOINING))
):
    """
    Create a new joining record.
    
    Permissions required: CREATE_JOINING
    """
    # Verify application exists
    application = db.query(Application).filter(
        Application.id == joining_data.application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {joining_data.application_id} not found"
        )
    
    # Check if application has accepted offer
    if application.status != ApplicationStatus.OFFERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create joining for application with status: {application.status.value}"
        )
    
    # Check for existing joining
    existing = db.query(Joining).filter(
        Joining.application_id == joining_data.application_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Joining record already exists for this application"
        )
    
    # Create joining
    new_joining = Joining(
        application_id=joining_data.application_id,
        expected_joining_date=joining_data.expected_joining_date,
        actual_joining_date=joining_data.actual_joining_date,
        employee_id=joining_data.employee_id,
        status=joining_data.status,
        documents_submitted=joining_data.documents_submitted,
        bgv_status=joining_data.bgv_status,
        bgv_completion_date=joining_data.bgv_completion_date,
        onboarding_status=joining_data.onboarding_status,
        replacement_required=joining_data.replacement_required,
        replacement_reason=joining_data.replacement_reason,
        remarks=joining_data.remarks,
        created_by=current_user.id
    )
    
    db.add(new_joining)
    
    # Update application status to JOINED if actual joining date is set
    if joining_data.actual_joining_date and joining_data.status == JoiningStatus.JOINED:
        application.status = ApplicationStatus.JOINED
    
    db.commit()
    db.refresh(new_joining)
    
    return new_joining


@router.get("", response_model=JoiningListResponse)
async def list_joinings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    application_id: Optional[int] = Query(None, description="Filter by application"),
    candidate_id: Optional[int] = Query(None, description="Filter by candidate"),
    jd_id: Optional[int] = Query(None, description="Filter by JD"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    status: Optional[JoiningStatus] = Query(None, description="Filter by status"),
    joining_from: Optional[date] = Query(None, description="Expected joining from date"),
    joining_to: Optional[date] = Query(None, description="Expected joining to date"),
    bgv_pending: bool = Query(False, description="Show only BGV pending"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_JOINING))
):
    """
    List all joinings with pagination and filters.
    
    Permissions required: VIEW_JOINING
    """
    # Base query
    query = db.query(Joining)
    
    # Apply filters
    if application_id:
        query = query.filter(Joining.application_id == application_id)
    
    if candidate_id:
        query = query.join(Application).filter(Application.candidate_id == candidate_id)
    
    if jd_id:
        query = query.join(Application).filter(Application.jd_id == jd_id)
    
    if client_id:
        query = query.join(Application).join(JobDescription).filter(
            JobDescription.client_id == client_id
        )
    
    if status:
        query = query.filter(Joining.status == status)
    
    if joining_from:
        query = query.filter(Joining.expected_joining_date >= joining_from)
    
    if joining_to:
        query = query.filter(Joining.expected_joining_date <= joining_to)
    
    if bgv_pending:
        query = query.filter(
            (Joining.bgv_status.is_(None)) | (Joining.bgv_status == 'pending')
        )
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results
    joinings = query.order_by(
        Joining.expected_joining_date.asc()
    ).offset(offset).limit(page_size).all()
    
    return JoiningListResponse(
        joinings=joinings,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{joining_id}", response_model=JoiningDetailResponse)
async def get_joining(
    joining_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_JOINING))
):
    """
    Get joining details by ID.
    
    Permissions required: VIEW_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    # Get application, candidate, JD, and offer info
    application = db.query(Application).filter(Application.id == joining.application_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first() if application else None
    jd = db.query(JobDescription).filter(JobDescription.id == application.jd_id).first() if application else None
    offer = db.query(Offer).filter(
        Offer.application_id == joining.application_id
    ).order_by(Offer.created_at.desc()).first()
    
    # Build detailed response
    response = JoiningDetailResponse(
        **joining.__dict__,
        candidate_name=f"{candidate.first_name} {candidate.last_name}" if candidate else None,
        candidate_email=candidate.email if candidate else None,
        candidate_phone=candidate.phone if candidate else None,
        jd_title=jd.title if jd else None,
        jd_code=jd.jd_code if jd else None,
        designation=offer.designation if offer else None,
        client_name=jd.client.company_name if jd and jd.client else None,
        offered_ctc=offer.annual_ctc if offer else None
    )
    
    return response


@router.put("/{joining_id}", response_model=JoiningResponse)
async def update_joining(
    joining_id: int,
    joining_data: JoiningUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JOINING))
):
    """
    Update joining information.
    
    Permissions required: UPDATE_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    # Update fields
    update_data = joining_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(joining, field, value)
    
    # If actual joining date is set and status is joined, update application
    if joining_data.actual_joining_date and joining_data.status == JoiningStatus.JOINED:
        application = db.query(Application).filter(
            Application.id == joining.application_id
        ).first()
        if application:
            application.status = ApplicationStatus.JOINED
    
    db.commit()
    db.refresh(joining)
    
    return joining


@router.patch("/{joining_id}/status", response_model=JoiningResponse)
async def update_joining_status(
    joining_id: int,
    status_update: JoiningStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JOINING))
):
    """
    Update joining status.
    
    Permissions required: UPDATE_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    old_status = joining.status
    joining.status = status_update.status
    
    # If status is JOINED, set actual joining date if not set
    if status_update.status == JoiningStatus.JOINED and not joining.actual_joining_date:
        joining.actual_joining_date = date.today()
        
        # Update application status
        application = db.query(Application).filter(
            Application.id == joining.application_id
        ).first()
        if application:
            application.status = ApplicationStatus.JOINED
    
    db.commit()
    db.refresh(joining)
    
    return joining


@router.post("/{joining_id}/mark-joined", response_model=JoiningResponse)
async def mark_joined(
    joining_id: int,
    employee_id: Optional[str] = Query(None, description="Employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JOINING))
):
    """
    Mark candidate as joined.
    
    Permissions required: UPDATE_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    # Update joining
    joining.status = JoiningStatus.JOINED
    joining.actual_joining_date = date.today()
    
    if employee_id:
        joining.employee_id = employee_id
    
    # Update application status
    application = db.query(Application).filter(
        Application.id == joining.application_id
    ).first()
    if application:
        application.status = ApplicationStatus.JOINED
    
    db.commit()
    db.refresh(joining)
    
    return joining


@router.post("/{joining_id}/no-show", response_model=JoiningResponse)
async def mark_no_show(
    joining_id: int,
    no_show: JoiningNoShow,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JOINING))
):
    """
    Mark candidate as no-show.
    
    Permissions required: UPDATE_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    # Update joining
    joining.status = JoiningStatus.NO_SHOW
    joining.replacement_required = no_show.replacement_required
    joining.replacement_reason = no_show.reason
    
    db.commit()
    db.refresh(joining)
    
    return joining


@router.patch("/{joining_id}/documents", response_model=JoiningResponse)
async def update_documents(
    joining_id: int,
    doc_update: JoiningDocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JOINING))
):
    """
    Update document submission status.
    
    Permissions required: UPDATE_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    joining.documents_submitted = doc_update.documents_submitted
    
    db.commit()
    db.refresh(joining)
    
    return joining


@router.patch("/{joining_id}/bgv", response_model=JoiningResponse)
async def update_bgv(
    joining_id: int,
    bgv_update: JoiningBGVUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JOINING))
):
    """
    Update background verification status.
    
    Permissions required: UPDATE_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    joining.bgv_status = bgv_update.bgv_status
    joining.bgv_completion_date = bgv_update.bgv_completion_date
    
    db.commit()
    db.refresh(joining)
    
    return joining


@router.patch("/{joining_id}/onboarding", response_model=JoiningResponse)
async def update_onboarding(
    joining_id: int,
    onboarding_update: JoiningOnboardingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JOINING))
):
    """
    Update onboarding status.
    
    Permissions required: UPDATE_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    joining.onboarding_status = onboarding_update.onboarding_status
    
    db.commit()
    db.refresh(joining)
    
    return joining


@router.get("/stats/overview", response_model=JoiningStats)
async def get_joining_stats(
    jd_id: Optional[int] = Query(None, description="Filter by JD"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    date_from: Optional[date] = Query(None, description="From date"),
    date_to: Optional[date] = Query(None, description="To date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """
    Get joining statistics.
    
    Permissions required: VIEW_REPORTS
    """
    # Base query
    query = db.query(Joining)
    
    # Apply filters
    if jd_id:
        query = query.join(Application).filter(Application.jd_id == jd_id)
    
    if client_id:
        query = query.join(Application).join(JobDescription).filter(
            JobDescription.client_id == client_id
        )
    
    if date_from:
        query = query.filter(Joining.expected_joining_date >= date_from)
    
    if date_to:
        query = query.filter(Joining.expected_joining_date <= date_to)
    
    # Count by status
    total_joinings = query.count()
    confirmed_joinings = query.filter(Joining.status == JoiningStatus.CONFIRMED).count()
    completed_joinings = query.filter(Joining.status == JoiningStatus.JOINED).count()
    no_show_count = query.filter(Joining.status == JoiningStatus.NO_SHOW).count()
    delayed_count = query.filter(Joining.status == JoiningStatus.DELAYED).count()
    replacement_required_count = query.filter(Joining.replacement_required == True).count()
    
    # Calculate rates
    total_expected = confirmed_joinings + completed_joinings + no_show_count + delayed_count
    joining_rate = (completed_joinings / total_expected * 100) if total_expected > 0 else 0
    no_show_rate = (no_show_count / total_expected * 100) if total_expected > 0 else 0
    
    # Calculate average days to join
    avg_days = query.filter(
        Joining.actual_joining_date.isnot(None),
        Joining.expected_joining_date.isnot(None)
    ).with_entities(
        func.avg(
            func.datediff(Joining.actual_joining_date, Joining.expected_joining_date)
        )
    ).scalar() or 0.0
    
    return JoiningStats(
        total_joinings=total_joinings,
        confirmed_joinings=confirmed_joinings,
        completed_joinings=completed_joinings,
        no_show_count=no_show_count,
        delayed_count=delayed_count,
        replacement_required_count=replacement_required_count,
        joining_rate=round(joining_rate, 2),
        no_show_rate=round(no_show_rate, 2),
        average_days_to_join=round(avg_days, 2)
    )


@router.get("/stats/upcoming", response_model=JoiningUpcoming)
async def get_upcoming_joinings(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_JOINING))
):
    """
    Get upcoming joinings count.
    
    Permissions required: VIEW_JOINING
    """
    today = date.today()
    week_end = today + timedelta(days=7)
    month_end = today + timedelta(days=30)
    next_month_end = today + timedelta(days=60)
    
    # Base query for confirmed joinings
    base_query = db.query(Joining).filter(
        Joining.status.in_([JoiningStatus.CONFIRMED, JoiningStatus.DELAYED])
    )
    
    # Count by date ranges
    today_count = base_query.filter(Joining.expected_joining_date == today).count()
    
    this_week = base_query.filter(
        Joining.expected_joining_date >= today,
        Joining.expected_joining_date <= week_end
    ).count()
    
    this_month = base_query.filter(
        Joining.expected_joining_date >= today,
        Joining.expected_joining_date <= month_end
    ).count()
    
    next_month = base_query.filter(
        Joining.expected_joining_date > month_end,
        Joining.expected_joining_date <= next_month_end
    ).count()
    
    return JoiningUpcoming(
        today=today_count,
        this_week=this_week,
        this_month=this_month,
        next_month=next_month
    )


@router.delete("/{joining_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_joining(
    joining_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_JOINING))
):
    """
    Delete a joining record.
    
    Permissions required: DELETE_JOINING
    """
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    # Can only delete if not yet joined
    if joining.status == JoiningStatus.JOINED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete completed joinings"
        )
    
    db.delete(joining)
    db.commit()
    
    return None
