"""
Joining/Onboarding management endpoints - MATCHES YOUR ACTUAL DATABASE
Replace: backend/app/api/v1/endpoints/joinings.py
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

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
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker

router = APIRouter()


@router.post("", response_model=JoiningResponse, status_code=status.HTTP_201_CREATED)
async def create_joining(
    joining_data: JoiningCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_JOINING))
):
    """Create a new joining record."""
    # Verify application exists
    application = db.query(Application).filter(
        Application.id == joining_data.application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {joining_data.application_id} not found"
        )
    
    # Get the offer for this application
    offer = db.query(Offer).filter(
        Offer.application_id == joining_data.application_id,
        Offer.status == 'accepted'  # Only accepted offers
    ).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No accepted offer found for this application"
        )
    
    # Check if joining already exists
    existing = db.query(Joining).filter(
        Joining.application_id == joining_data.application_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Joining record already exists for this application"
        )
    
    # Create joining - matching YOUR database schema
    new_joining = Joining(
        application_id=joining_data.application_id,
        offer_id=offer.id,  # Required in your DB
        expected_joining_date=joining_data.expected_joining_date,
        actual_joining_date=joining_data.actual_joining_date,
        employee_id=joining_data.employee_id,
        status=joining_data.status,
        # documents_submitted=joining_data.documents_submitted,
        # bgv_status=joining_data.bgv_status,
        # bgv_completion_date=joining_data.bgv_completion_date,
        # onboarding_status=joining_data.onboarding_status,
        # replacement_reason=joining_data.replacement_reason,
        notes=joining_data.remarks,
        # replacement_required=False,  # Default from your schema
        created_by=current_user.id
    )
    
    db.add(new_joining)
    
    # Update application status
    application.status = ApplicationStatus.JOINED
    
    db.commit()
    db.refresh(new_joining)
    
    return new_joining


@router.get("", response_model=JoiningListResponse)
async def list_joinings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[JoiningStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_JOINING))
):
    """List all joinings."""
    query = db.query(Joining)
    
    if status:
        query = query.filter(Joining.status == status)
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    joinings = query.order_by(Joining.expected_joining_date.desc()).offset(offset).limit(page_size).all()
    
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
    """Get joining details."""
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    application = db.query(Application).filter(Application.id == joining.application_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first() if application else None
    jd = db.query(JobDescription).filter(JobDescription.id == application.jd_id).first() if application else None
    offer = db.query(Offer).filter(Offer.id == joining.offer_id).first()
    
    response = JoiningDetailResponse(
        **joining.__dict__,
        candidate_name=f"{candidate.first_name} {candidate.last_name}" if candidate else None,
        candidate_email=candidate.email if candidate else None,
        candidate_phone=candidate.phone if candidate else None,
        jd_title=jd.title if jd else None,
        jd_code=jd.jd_code if jd else None,
        designation=offer.designation if offer else None,
        client_name=jd.client.company_name if jd and jd.client else None,
        offered_ctc=offer.annual_ctc if offer else None,
    )
    
    return response


@router.put("/{joining_id}", response_model=JoiningResponse)
async def update_joining(
    joining_id: int,
    joining_data: JoiningUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_JOINING))
):
    """Update joining."""
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    update_data = joining_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(joining, field, value)
    
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
    """Update joining status."""
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    joining.status = status_update.status
    
    # Auto-set actual joining date when status = CONFIRMED
    if status_update.status == JoiningStatus.CONFIRMED and not joining.actual_joining_date:
        joining.actual_joining_date = date.today()
    
    if status_update.notes:
        joining.remarks = status_update.notes
    
    db.commit()
    db.refresh(joining)
    
    return joining


@router.delete("/{joining_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_joining(
    joining_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_JOINING))
):
    """Delete joining."""
    joining = db.query(Joining).filter(Joining.id == joining_id).first()
    
    if not joining:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Joining with ID {joining_id} not found"
        )
    
    db.delete(joining)
    db.commit()
    
    return None
