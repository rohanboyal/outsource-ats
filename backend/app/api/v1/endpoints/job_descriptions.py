"""
Job Description management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.client import Client
from app.models.pitch import Pitch
from app.models.job_description import JobDescription, JDStatus, JDPriority, ContractType
from app.models.application import Application, ApplicationStatus
from app.models.interview import Interview
from app.models.offer import Offer, OfferStatus
from app.schemas.job_description import (
    JobDescriptionCreate,
    JobDescriptionUpdate,
    JobDescriptionResponse,
    JobDescriptionListResponse,
    JobDescriptionDetailResponse,
    JobDescriptionAssignment,
    JobDescriptionStatusUpdate
)
from app.core.permissions import Permission, UserRole
from app.api.deps import get_current_user, PermissionChecker


router = APIRouter()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_jd_code(client_id: int, db: Session) -> str:
    """Generate unique JD code."""
    # Get client
    client = db.query(Client).filter(Client.id == client_id).first()
    client_prefix = client.company_name[:3].upper() if client else "JD"
    
    # Count existing JDs for this client
    print(f"Generating JD code for client {client_id} with prefix {client_prefix}")
    count = db.query(JobDescription).filter(JobDescription.client_id == client_id).count()
    print(f"Generating JD code for client {client_id} with prefix {client_prefix} and count {count}")
    
    # Generate code: CLIENT_XXX
    return f"{client_prefix}_{count + 1:04d}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"


# ============================================================================
# JOB DESCRIPTION ENDPOINTS
# ============================================================================

@router.post("", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_job_description(
    jd_data: JobDescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_JD))
):
    """
    Create a new job description.
    
    Permissions required: CREATE_JD
    """
    # Verify client exists
    client = db.query(Client).filter(Client.id == jd_data.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {jd_data.client_id} not found"
        )
    
    # Verify pitch if provided
    if jd_data.pitch_id:
        pitch = db.query(Pitch).filter(Pitch.id == jd_data.pitch_id).first()
        if not pitch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pitch with ID {jd_data.pitch_id} not found"
            )
    
    # Verify recruiter if assigned
    if jd_data.assigned_recruiter_id:
        recruiter = db.query(User).filter(User.id == jd_data.assigned_recruiter_id).first()
        if not recruiter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recruiter with ID {jd_data.assigned_recruiter_id} not found"
            )
    
    # Generate JD code
    jd_code = generate_jd_code(jd_data.client_id, db)
    
    # Use client's default SLA if not provided
    sla_days = jd_data.sla_days if jd_data.sla_days else client.default_sla_days
    
    # Create JD
    new_jd = JobDescription(
        jd_code=jd_code,
        client_id=jd_data.client_id,
        pitch_id=jd_data.pitch_id,
        assigned_recruiter_id=jd_data.assigned_recruiter_id,
        title=jd_data.title,
        description=jd_data.description,
        required_skills=jd_data.required_skills,
        preferred_skills=jd_data.preferred_skills,
        experience_min=jd_data.experience_min,
        experience_max=jd_data.experience_max,
        location=jd_data.location,
        work_mode=jd_data.work_mode,
        contract_type=jd_data.contract_type,
        open_positions=jd_data.open_positions,
        filled_positions=0,
        status=jd_data.status,
        priority=jd_data.priority,
        sla_days=sla_days,
        version=1,
        budget_min=jd_data.budget_min,
        budget_max=jd_data.budget_max,
        currency=jd_data.currency,
        benefits=jd_data.benefits,
        created_by=current_user.id
    )
    
    db.add(new_jd)
    db.commit()
    db.refresh(new_jd)
    
    return new_jd


@router.get("", response_model=JobDescriptionListResponse)
async def list_job_descriptions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by title, JD code, or skills"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    status: Optional[JDStatus] = Query(None, description="Filter by status"),
    priority: Optional[JDPriority] = Query(None, description="Filter by priority"),
    assigned_recruiter_id: Optional[int] = Query(None, description="Filter by recruiter"),
    contract_type: Optional[ContractType] = Query(None, description="Filter by contract type"),
    location: Optional[str] = Query(None, description="Filter by location"),
    include_deleted: bool = Query(False, description="Include soft-deleted JDs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_JD))
):
    """
    List all job descriptions with pagination and filters.
    
    Permissions required: VIEW_JD
    """
    # Base query
    query = db.query(JobDescription)
    
    # Recruiter sees only assigned JDs (unless admin)
    if current_user.role == UserRole.RECRUITER:
        query = query.filter(JobDescription.assigned_recruiter_id == current_user.id)
    
    # Filter out deleted JDs unless requested
    if not include_deleted:
        query = query.filter(JobDescription.deleted_at.is_(None))
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                JobDescription.title.ilike(search_term),
                JobDescription.jd_code.ilike(search_term),
                JobDescription.description.ilike(search_term)
            )
        )
    
    if client_id:
        query = query.filter(JobDescription.client_id == client_id)
    
    if status:
        query = query.filter(JobDescription.status == status)
    
    if priority:
        query = query.filter(JobDescription.priority == priority)
    
    if assigned_recruiter_id:
        query = query.filter(JobDescription.assigned_recruiter_id == assigned_recruiter_id)
    
    if contract_type:
        query = query.filter(JobDescription.contract_type == contract_type)
    
    if location:
        query = query.filter(JobDescription.location.ilike(f"%{location}%"))
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results - order by priority and created date
    job_descriptions = query.order_by(
        JobDescription.priority.desc(),
        JobDescription.created_at.desc()
    ).offset(offset).limit(page_size).all()
    
    return JobDescriptionListResponse(
        job_descriptions=job_descriptions,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{jd_id}", response_model=JobDescriptionDetailResponse)
async def get_job_description(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_JD))
):
    """
    Get job description details by ID with statistics.
    
    Permissions required: VIEW_JD
    """
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {jd_id} not found"
        )
    
    # Recruiter can only view assigned JDs
    if current_user.role == UserRole.RECRUITER and jd.assigned_recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view JDs assigned to you"
        )
    
    # Get statistics
    total_applications = db.query(func.count(Application.id)).filter(
        Application.jd_id == jd_id
    ).scalar() or 0
    
    active_applications = db.query(func.count(Application.id)).filter(
        Application.jd_id == jd_id,
        Application.status.in_([
            ApplicationStatus.SOURCED,
            ApplicationStatus.SCREENED,
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INTERVIEWING,
            ApplicationStatus.OFFERED
        ])
    ).scalar() or 0
    
    submitted_applications = db.query(func.count(Application.id)).filter(
        Application.jd_id == jd_id,
        Application.submitted_to_client_date.isnot(None)
    ).scalar() or 0
    
    interviewed_candidates = db.query(func.count(func.distinct(Application.candidate_id))).join(
        Interview, Application.id == Interview.application_id
    ).filter(Application.jd_id == jd_id).scalar() or 0
    
    offers_extended = db.query(func.count(Offer.id)).join(
        Application, Offer.application_id == Application.id
    ).filter(
        Application.jd_id == jd_id,
        Offer.status.in_([OfferStatus.SENT, OfferStatus.NEGOTIATING, OfferStatus.ACCEPTED])
    ).scalar() or 0
    
    positions_filled = jd.filled_positions
    
    # Convert to response with statistics
    response = JobDescriptionDetailResponse(
        **jd.__dict__,
        total_applications=total_applications,
        active_applications=active_applications,
        submitted_applications=submitted_applications,
        interviewed_candidates=interviewed_candidates,
        offers_extended=offers_extended,
        positions_filled=positions_filled
    )
    
    return response


@router.put("/{jd_id}", response_model=JobDescriptionResponse)
async def update_job_description(
    jd_id: int,
    jd_data: JobDescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JD))
):
    """
    Update job description information.
    
    Permissions required: UPDATE_JD
    """
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {jd_id} not found"
        )
    
    # Check if JD is deleted
    if jd.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a deleted job description"
        )
    
    # Check if JD is editable
    if jd.status == JDStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a closed job description"
        )
    
    # Verify recruiter if being assigned
    if jd_data.assigned_recruiter_id is not None and jd_data.assigned_recruiter_id:
        recruiter = db.query(User).filter(User.id == jd_data.assigned_recruiter_id).first()
        if not recruiter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recruiter with ID {jd_data.assigned_recruiter_id} not found"
            )
    
    # Update fields
    update_data = jd_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(jd, field, value)
    
    db.commit()
    db.refresh(jd)
    
    return jd


@router.delete("/{jd_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_description(
    jd_id: int,
    hard_delete: bool = Query(False, description="Permanently delete (admin only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_JD))
):
    """
    Delete job description (soft delete by default).
    
    Permissions required: DELETE_JD
    """
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {jd_id} not found"
        )
    
    # Check if JD has active applications
    active_apps = db.query(Application).filter(
        Application.jd_id == jd_id,
        Application.status.in_([
            ApplicationStatus.SOURCED,
            ApplicationStatus.SCREENED,
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INTERVIEWING,
            ApplicationStatus.OFFERED
        ])
    ).count()
    
    if active_apps > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete JD with {active_apps} active applications. Close the JD instead."
        )
    
    if hard_delete:
        # Hard delete - requires admin
        if not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hard delete requires admin privileges"
            )
        db.delete(jd)
    else:
        # Soft delete
        jd.deleted_at = datetime.utcnow()
        jd.status = JDStatus.CLOSED
    
    db.commit()
    
    return None


@router.post("/{jd_id}/assign", response_model=JobDescriptionResponse)
async def assign_job_description(
    jd_id: int,
    assignment: JobDescriptionAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.ASSIGN_JD))
):
    """
    Assign job description to a recruiter.
    
    Permissions required: ASSIGN_JD
    """
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {jd_id} not found"
        )
    
    # Verify recruiter exists
    recruiter = db.query(User).filter(User.id == assignment.recruiter_id).first()
    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recruiter with ID {assignment.recruiter_id} not found"
        )
    
    # Assign recruiter
    jd.assigned_recruiter_id = assignment.recruiter_id
    
    db.commit()
    db.refresh(jd)
    
    return jd


@router.patch("/{jd_id}/status", response_model=JobDescriptionResponse)
async def update_jd_status(
    jd_id: int,
    status_update: JobDescriptionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JD))
):
    """
    Update job description status.
    
    Permissions required: UPDATE_JD
    """
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {jd_id} not found"
        )
    
    # Update status
    jd.status = status_update.status
    
    db.commit()
    db.refresh(jd)
    
    return jd


@router.get("/{jd_id}/applications", response_model=List[dict])
async def get_jd_applications(
    jd_id: int,
    status: Optional[ApplicationStatus] = Query(None, description="Filter by application status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_APPLICATION))
):
    """
    Get all applications for a job description.
    
    Permissions required: VIEW_APPLICATION
    """
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {jd_id} not found"
        )
    
    # Base query
    query = db.query(Application).filter(Application.jd_id == jd_id)
    
    # Filter by status if provided
    if status:
        query = query.filter(Application.status == status)
    
    applications = query.all()
    
    # Return simplified application list
    return [
        {
            "id": app.id,
            "candidate_id": app.candidate_id,
            "status": app.status.value,
            "created_at": app.created_at,
            "submitted_to_client_date": app.submitted_to_client_date,
            "sla_status": app.sla_status.value if app.sla_status else None
        }
        for app in applications
    ]
