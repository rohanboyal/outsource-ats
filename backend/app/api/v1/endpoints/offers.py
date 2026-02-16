"""
Offer management endpoints - COMPLETE WORKING VERSION
Replace your entire /backend/app/api/v1/endpoints/offers.py with this file
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date

from app.db.session import get_db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus
from app.models.job_description import JobDescription
from app.models.offer import Offer, OfferStatus
from app.schemas.offer import (
    OfferCreate,
    OfferUpdate,
    OfferResponse,
    OfferListResponse,
    OfferDetailResponse,
    OfferStatusUpdate,
    OfferNegotiation,
    OfferRevision,
    OfferStats
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker


router = APIRouter()


def generate_offer_number(db: Session) -> str:
    """Generate unique offer number."""
    count = db.query(Offer).count()
    return f"OFR{date.today().strftime('%Y%m')}{count + 1:04d}"


@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_data: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_OFFER))
):
    """Create a new offer."""
    # Verify application exists
    application = db.query(Application).filter(
        Application.id == offer_data.application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {offer_data.application_id} not found"
        )
    
    # Check for existing active offer
    existing = db.query(Offer).filter(
        Offer.application_id == offer_data.application_id,
        Offer.status.in_([OfferStatus.DRAFT, OfferStatus.SENT, OfferStatus.NEGOTIATING])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active offer already exists for this application"
        )
    
    # Generate offer number
    offer_number = generate_offer_number(db)
    
    # Create offer - NO MAPPING, use schema fields directly
    new_offer = Offer(
        offer_number=offer_number,
        application_id=offer_data.application_id,
        designation=offer_data.designation,

        ctc_annual=offer_data.annual_ctc,
        fixed_component=offer_data.base_salary,
        variable_component=offer_data.variable_pay,

        other_benefits=offer_data.benefits,
        joining_date_proposed=offer_data.joining_date,
        offer_valid_till=offer_data.offer_valid_till,

        notes=offer_data.remarks,

        status=OfferStatus.DRAFT,
        revision_number=1,
        created_by=current_user.id
    )

    
    db.add(new_offer)
    
    # Update application status
    application.status = ApplicationStatus.OFFERED
    
    db.commit()
    db.refresh(new_offer)
    
    return new_offer


@router.get("", response_model=OfferListResponse)
async def list_offers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    application_id: Optional[int] = None,
    status: Optional[OfferStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_OFFER))
):
    """List all offers with pagination."""
    query = db.query(Offer)
    
    if application_id:
        query = query.filter(Offer.application_id == application_id)
    
    if status:
        query = query.filter(Offer.status == status)
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    offers = query.order_by(Offer.created_at.desc()).offset(offset).limit(page_size).all()
    
    return OfferListResponse(
        offers=offers,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{offer_id}", response_model=OfferDetailResponse)
async def get_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_OFFER))
):
    """Get offer details."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    application = db.query(Application).filter(Application.id == offer.application_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first() if application else None
    jd = db.query(JobDescription).filter(JobDescription.id == application.jd_id).first() if application else None
    
    revisions_count = db.query(Offer).filter(Offer.parent_offer_id == offer_id).count()
    
    response = OfferDetailResponse(
        **offer.__dict__,
        candidate_name=f"{candidate.first_name} {candidate.last_name}" if candidate else None,
        candidate_email=candidate.email if candidate else None,
        candidate_current_ctc=candidate.current_ctc if candidate else None,
        candidate_expected_ctc=candidate.expected_ctc if candidate else None,
        jd_title=jd.title if jd else None,
        jd_code=jd.jd_code if jd else None,
        client_name=jd.client.company_name if jd and jd.client else None,
        revisions_count=revisions_count
    )
    
    return response


@router.put("/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: int,
    offer_data: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_OFFER))
):
    """Update offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    if offer.status != OfferStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update draft offers"
        )
    
    update_data = offer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(offer, field, value)
    
    db.commit()
    db.refresh(offer)
    
    return offer


@router.patch("/{offer_id}/status", response_model=OfferResponse)
async def update_offer_status(
    offer_id: int,
    status_update: OfferStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_OFFER))
):
    """Update offer status."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    offer.status = status_update.status
    
    if status_update.status == OfferStatus.SENT and not offer.sent_date:
        offer.sent_date = date.today()
    
    if status_update.status == OfferStatus.ACCEPTED:
        offer.acceptance_date = date.today()
        application = db.query(Application).filter(Application.id == offer.application_id).first()
        if application:
            application.status = ApplicationStatus.OFFERED
    
    if status_update.status == OfferStatus.ACCEPTED:
        offer.acceptance_date = date.today()
    
    db.commit()
    db.refresh(offer)
    
    return offer


@router.post("/{offer_id}/send", response_model=OfferResponse)
async def send_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.SEND_OFFER))
):
    """Send offer to candidate."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    if offer.status != OfferStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only send draft offers"
        )
    
    offer.status = OfferStatus.SENT
    offer.sent_date = date.today()
    
    db.commit()
    db.refresh(offer)
    
    return offer


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_OFFER))
):
    """Delete offer (draft only)."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    if offer.status != OfferStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft offers"
        )
    
    db.delete(offer)
    db.commit()
    
    return None
