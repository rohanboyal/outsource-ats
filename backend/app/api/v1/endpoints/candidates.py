"""
Candidate management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import os
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.candidate import Candidate, CandidateSource
from app.models.application import Application, ApplicationStatus
from app.models.interview import Interview
from app.models.offer import Offer, OfferStatus
from app.schemas.candidate import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    CandidateListResponse,
    CandidateDetailResponse,
    CandidateDuplicateCheck,
    CandidateDuplicateResponse
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker
from app.core.config import settings


# Create router instance
router = APIRouter()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def save_resume(file: UploadFile, candidate_id: int) -> tuple:
    """
    Save uploaded resume file.
    
    Returns:
        tuple: (file_path, original_filename)
    """
    # Create upload directory if not exists
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"resume_candidate_{candidate_id}_{timestamp}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    
    return file_path, file.filename


# ============================================================================
# CANDIDATE ENDPOINTS
# ============================================================================

@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    candidate_data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_CANDIDATE))
):
    """
    Create a new candidate.
    
    Permissions required: CREATE_CANDIDATE
    """
    # Check for duplicate email
    existing = db.query(Candidate).filter(Candidate.email == candidate_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate with email {candidate_data.email} already exists"
        )
    
    # Create candidate
    new_candidate = Candidate(
        first_name=candidate_data.first_name,
        last_name=candidate_data.last_name,
        email=candidate_data.email,
        phone=candidate_data.phone,
        alternate_phone=candidate_data.alternate_phone,
        current_company=candidate_data.current_company,
        current_designation=candidate_data.current_designation,
        total_experience=candidate_data.total_experience,
        relevant_experience=candidate_data.relevant_experience,
        skills=candidate_data.skills,
        certifications=candidate_data.certifications,
        current_location=candidate_data.current_location,
        preferred_locations=candidate_data.preferred_locations,
        willing_to_relocate=1 if candidate_data.willing_to_relocate else 0,
        notice_period_days=candidate_data.notice_period_days,
        serving_notice_period=1 if candidate_data.serving_notice_period else 0,
        current_ctc=candidate_data.current_ctc,
        expected_ctc=candidate_data.expected_ctc,
        currency=candidate_data.currency,
        source=candidate_data.source,
        source_details=candidate_data.source_details,
        linkedin_url=candidate_data.linkedin_url,
        github_url=candidate_data.github_url,
        portfolio_url=candidate_data.portfolio_url,
        highest_education=candidate_data.highest_education,
        education_details=candidate_data.education_details,
        notes=candidate_data.notes,
        tags=candidate_data.tags,
        created_by=current_user.id
    )
    
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    
    return new_candidate


@router.get("", response_model=CandidateListResponse)
async def list_candidates(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name, email, or company"),
    skills: Optional[str] = Query(None, description="Filter by skills (comma-separated)"),
    location: Optional[str] = Query(None, description="Filter by location"),
    min_experience: Optional[float] = Query(None, ge=0, description="Minimum experience"),
    max_experience: Optional[float] = Query(None, ge=0, description="Maximum experience"),
    source: Optional[CandidateSource] = Query(None, description="Filter by source"),
    notice_period_max: Optional[int] = Query(None, ge=0, description="Max notice period days"),
    include_deleted: bool = Query(False, description="Include soft-deleted candidates"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_CANDIDATE))
):
    """
    List all candidates with pagination and filters.
    
    Permissions required: VIEW_CANDIDATE
    """
    # Base query
    query = db.query(Candidate)
    
    # Filter out deleted candidates unless requested
    if not include_deleted:
        query = query.filter(Candidate.deleted_at.is_(None))
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Candidate.first_name.ilike(search_term),
                Candidate.last_name.ilike(search_term),
                Candidate.email.ilike(search_term),
                Candidate.current_company.ilike(search_term)
            )
        )
    
    if skills:
        # Filter by skills (JSON array contains)
        skill_list = [s.strip() for s in skills.split(",")]
        for skill in skill_list:
            query = query.filter(Candidate.skills.contains([skill]))
    
    if location:
        query = query.filter(
            or_(
                Candidate.current_location.ilike(f"%{location}%"),
                Candidate.preferred_locations.contains([location])
            )
        )
    
    if min_experience is not None:
        query = query.filter(Candidate.total_experience >= min_experience)
    
    if max_experience is not None:
        query = query.filter(Candidate.total_experience <= max_experience)
    
    if source:
        query = query.filter(Candidate.source == source)
    
    if notice_period_max is not None:
        query = query.filter(
            or_(
                Candidate.notice_period_days.is_(None),
                Candidate.notice_period_days <= notice_period_max
            )
        )
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results
    candidates = query.offset(offset).limit(page_size).all()
    
    return CandidateListResponse(
        candidates=candidates,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
async def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_CANDIDATE))
):
    """
    Get candidate details by ID with statistics.
    
    Permissions required: VIEW_CANDIDATE
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found"
        )
    
    # Get statistics
    total_applications = db.query(func.count(Application.id)).filter(
        Application.candidate_id == candidate_id
    ).scalar() or 0
    
    active_applications = db.query(func.count(Application.id)).filter(
        Application.candidate_id == candidate_id,
        Application.status.in_([
            ApplicationStatus.SOURCED,
            ApplicationStatus.SCREENED,
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INTERVIEWING,
            ApplicationStatus.OFFERED
        ])
    ).scalar() or 0
    
    interviews_scheduled = db.query(func.count(Interview.id)).join(
        Application, Interview.application_id == Application.id
    ).filter(Application.candidate_id == candidate_id).scalar() or 0
    
    offers_received = db.query(func.count(Offer.id)).join(
        Application, Offer.application_id == Application.id
    ).filter(
        Application.candidate_id == candidate_id,
        Offer.status.in_([OfferStatus.SENT, OfferStatus.NEGOTIATING, OfferStatus.ACCEPTED])
    ).scalar() or 0
    
    # Convert to response with statistics
    response = CandidateDetailResponse(
        **candidate.__dict__,
        total_applications=total_applications,
        active_applications=active_applications,
        interviews_scheduled=interviews_scheduled,
        offers_received=offers_received
    )
    
    return response


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: int,
    candidate_data: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_CANDIDATE))
):
    """
    Update candidate information.
    
    Permissions required: UPDATE_CANDIDATE
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found"
        )
    
    # Check if candidate is deleted
    if candidate.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a deleted candidate"
        )
    
    # Check for duplicate email if being updated
    if candidate_data.email and candidate_data.email != candidate.email:
        existing = db.query(Candidate).filter(
            Candidate.email == candidate_data.email,
            Candidate.id != candidate_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Candidate with email {candidate_data.email} already exists"
            )
    
    # Update fields
    update_data = candidate_data.model_dump(exclude_unset=True)
    
    # Handle boolean fields conversion to integer
    if 'willing_to_relocate' in update_data:
        update_data['willing_to_relocate'] = 1 if update_data['willing_to_relocate'] else 0
    if 'serving_notice_period' in update_data:
        update_data['serving_notice_period'] = 1 if update_data['serving_notice_period'] else 0
    
    for field, value in update_data.items():
        setattr(candidate, field, value)
    
    db.commit()
    db.refresh(candidate)
    
    return candidate


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: int,
    hard_delete: bool = Query(False, description="Permanently delete (admin only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_CANDIDATE))
):
    """
    Delete candidate (soft delete by default, hard delete if specified).
    
    Permissions required: DELETE_CANDIDATE
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found"
        )
    
    # Check if candidate has active applications
    active_apps = db.query(Application).filter(
        Application.candidate_id == candidate_id,
        Application.status.in_([
            ApplicationStatus.SOURCED,
            ApplicationStatus.SCREENED,
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INTERVIEWING,
            ApplicationStatus.OFFERED
        ])
    ).count()
    
    if active_apps > 0 and hard_delete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot hard delete candidate with {active_apps} active applications"
        )
    
    if hard_delete:
        # Hard delete - requires admin
        if not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hard delete requires admin privileges"
            )
        db.delete(candidate)
    else:
        # Soft delete
        candidate.deleted_at = datetime.utcnow()
    
    db.commit()
    
    return None


@router.post("/{candidate_id}/upload-resume", response_model=CandidateResponse)
async def upload_resume(
    candidate_id: int,
    file: UploadFile = File(..., description="Resume file (PDF, DOC, DOCX)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPLOAD_RESUME))
):
    """
    Upload resume for a candidate.
    
    Permissions required: UPLOAD_RESUME
    
    Supported formats: PDF, DOC, DOCX
    Max size: 10MB
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found"
        )
    
    # Check file extension
    allowed_extensions = [".pdf", ".doc", ".docx"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Check file size (max 10MB)
    file.file.seek(0, 2)  # Move to end
    file_size = file.file.tell()  # Get size
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
        )
    
    # Save file
    file_path, original_name = save_resume(file, candidate_id)
    
    # Update candidate
    candidate.resume_path = file_path
    candidate.resume_original_name = original_name
    
    # TODO: Parse resume (future enhancement)
    # candidate.resume_parsed_data = parse_resume(file_path)
    
    db.commit()
    db.refresh(candidate)
    
    return candidate


@router.post("/check-duplicate", response_model=CandidateDuplicateResponse)
async def check_duplicate(
    check_data: CandidateDuplicateCheck,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_CANDIDATE))
):
    """
    Check for duplicate candidates by email or phone.
    
    Permissions required: CREATE_CANDIDATE
    """
    matching_candidates = []
    match_reasons = []
    
    # Check by email
    email_match = db.query(Candidate).filter(Candidate.email == check_data.email).first()
    if email_match:
        matching_candidates.append(email_match)
        match_reasons.append(f"Email match: {check_data.email}")
    
    # Check by phone if provided
    if check_data.phone:
        phone_match = db.query(Candidate).filter(
            or_(
                Candidate.phone == check_data.phone,
                Candidate.alternate_phone == check_data.phone
            )
        ).first()
        
        if phone_match and phone_match not in matching_candidates:
            matching_candidates.append(phone_match)
            match_reasons.append(f"Phone match: {check_data.phone}")
    
    return CandidateDuplicateResponse(
        is_duplicate=len(matching_candidates) > 0,
        matching_candidates=matching_candidates,
        match_reasons=match_reasons
    )


@router.get("/{candidate_id}/applications", response_model=List[dict])
async def get_candidate_applications(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_APPLICATION))
):
    """
    Get all applications for a candidate.
    
    Permissions required: VIEW_APPLICATION
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found"
        )
    
    applications = db.query(Application).filter(
        Application.candidate_id == candidate_id
    ).all()
    
    # Return simplified application list
    return [
        {
            "id": app.id,
            "jd_id": app.jd_id,
            "status": app.status.value,
            "created_at": app.created_at,
            "submitted_to_client_date": app.submitted_to_client_date
        }
        for app in applications
    ]