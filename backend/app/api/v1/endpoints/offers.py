"""
Offer management endpoints.
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


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_offer_number(db: Session) -> str:
    """Generate unique offer number."""
    count = db.query(Offer).count()
    return f"OFR{date.today().strftime('%Y%m')}{count + 1:04d}"


# ============================================================================
# OFFER ENDPOINTS
# ============================================================================

@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_data: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_OFFER))
):
    """
    Create a new offer.
    
    Permissions required: CREATE_OFFER
    """
    # Verify application exists
    application = db.query(Application).filter(
        Application.id == offer_data.application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {offer_data.application_id} not found"
        )
    
    # Check if application is in valid status
    if application.status != ApplicationStatus.INTERVIEWING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create offer for application with status: {application.status.value}"
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
    
    # Create offer
    new_offer = Offer(
        offer_number=offer_number,
        application_id=offer_data.application_id,
        designation=offer_data.designation,
        annual_ctc=offer_data.annual_ctc,
        base_salary=offer_data.base_salary,
        variable_pay=offer_data.variable_pay,
        bonus=offer_data.bonus,
        benefits=offer_data.benefits,
        joining_date=offer_data.joining_date,
        offer_valid_till=offer_data.offer_valid_till,
        work_location=offer_data.work_location,
        status=OfferStatus.DRAFT,
        version=1,
        remarks=offer_data.remarks,
        created_by=current_user.id
    )
    
    db.add(new_offer)
    
    # Update application status to OFFERED
    application.status = ApplicationStatus.OFFERED
    
    db.commit()
    db.refresh(new_offer)
    
    return new_offer


@router.get("", response_model=OfferListResponse)
async def list_offers(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    application_id: Optional[int] = Query(None, description="Filter by application"),
    candidate_id: Optional[int] = Query(None, description="Filter by candidate"),
    jd_id: Optional[int] = Query(None, description="Filter by JD"),
    status: Optional[OfferStatus] = Query(None, description="Filter by status"),
    sent_from: Optional[date] = Query(None, description="Sent from date"),
    sent_to: Optional[date] = Query(None, description="Sent to date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_OFFER))
):
    """
    List all offers with pagination and filters.
    
    Permissions required: VIEW_OFFER
    """
    # Base query
    query = db.query(Offer)
    
    # Apply filters
    if application_id:
        query = query.filter(Offer.application_id == application_id)
    
    if candidate_id:
        query = query.join(Application).filter(Application.candidate_id == candidate_id)
    
    if jd_id:
        query = query.join(Application).filter(Application.jd_id == jd_id)
    
    if status:
        query = query.filter(Offer.status == status)
    
    if sent_from:
        query = query.filter(Offer.sent_date >= sent_from)
    
    if sent_to:
        query = query.filter(Offer.sent_date <= sent_to)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results
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
    """
    Get offer details by ID.
    
    Permissions required: VIEW_OFFER
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    # Get application, candidate, and JD info
    application = db.query(Application).filter(Application.id == offer.application_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first() if application else None
    jd = db.query(JobDescription).filter(JobDescription.id == application.jd_id).first() if application else None
    
    # Count revisions
    revisions_count = db.query(Offer).filter(Offer.parent_offer_id == offer_id).count()
    
    # Build detailed response
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
    """
    Update offer information.
    
    Permissions required: UPDATE_OFFER
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    # Can only update draft offers
    if offer.status != OfferStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update draft offers. Use revision for sent offers."
        )
    
    # Update fields
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
    """
    Update offer status.
    
    Permissions required: UPDATE_OFFER
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    old_status = offer.status
    new_status = status_update.status
    
    # Update status and dates
    offer.status = new_status
    
    if new_status == OfferStatus.SENT and not offer.sent_date:
        offer.sent_date = date.today()
    
    if new_status == OfferStatus.ACCEPTED:
        offer.accepted_date = date.today()
        # Update application status
        application = db.query(Application).filter(Application.id == offer.application_id).first()
        if application:
            application.status = ApplicationStatus.OFFERED
    
    if new_status == OfferStatus.REJECTED:
        offer.rejected_date = date.today()
    
    db.commit()
    db.refresh(offer)
    
    return offer


@router.post("/{offer_id}/send", response_model=OfferResponse)
async def send_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.SEND_OFFER))
):
    """
    Send offer to candidate.
    
    Permissions required: SEND_OFFER
    """
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
    
    # Update status
    offer.status = OfferStatus.SENT
    offer.sent_date = date.today()
    
    db.commit()
    db.refresh(offer)
    
    return offer


@router.post("/{offer_id}/negotiate", response_model=OfferResponse)
async def negotiate_offer(
    offer_id: int,
    negotiation: OfferNegotiation,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_OFFER))
):
    """
    Mark offer as under negotiation.
    
    Permissions required: UPDATE_OFFER
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    if offer.status != OfferStatus.SENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only negotiate sent offers"
        )
    
    # Update status
    offer.status = OfferStatus.NEGOTIATING
    offer.remarks = f"Candidate counter: {negotiation.candidate_counter_ctc}. {negotiation.negotiation_notes or ''}"
    
    db.commit()
    db.refresh(offer)
    
    return offer


@router.post("/{offer_id}/revise", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer_revision(
    offer_id: int,
    revision: OfferRevision,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_OFFER))
):
    """
    Create a revised offer.
    
    Permissions required: CREATE_OFFER
    """
    parent_offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not parent_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    # Generate new offer number
    offer_number = generate_offer_number(db)
    
    # Create revised offer
    revised_offer = Offer(
        offer_number=offer_number,
        application_id=parent_offer.application_id,
        designation=parent_offer.designation,
        annual_ctc=revision.annual_ctc,
        base_salary=revision.base_salary,
        variable_pay=revision.variable_pay,
        bonus=revision.bonus,
        benefits=revision.benefits or parent_offer.benefits,
        joining_date=parent_offer.joining_date,
        offer_valid_till=parent_offer.offer_valid_till,
        work_location=parent_offer.work_location,
        status=OfferStatus.DRAFT,
        version=parent_offer.version + 1,
        parent_offer_id=offer_id,
        revision_reason=revision.revision_reason,
        created_by=current_user.id
    )
    
    db.add(revised_offer)
    
    # Mark parent as superseded
    parent_offer.status = OfferStatus.SUPERSEDED
    
    db.commit()
    db.refresh(revised_offer)
    
    return revised_offer


@router.get("/{offer_id}/revisions", response_model=List[OfferResponse])
async def get_offer_revisions(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_OFFER))
):
    """
    Get all revisions of an offer.
    
    Permissions required: VIEW_OFFER
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    # Get all revisions
    revisions = db.query(Offer).filter(Offer.parent_offer_id == offer_id).all()
    
    return revisions


@router.get("/stats/overview", response_model=OfferStats)
async def get_offer_stats(
    jd_id: Optional[int] = Query(None, description="Filter by JD"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    date_from: Optional[date] = Query(None, description="From date"),
    date_to: Optional[date] = Query(None, description="To date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """
    Get offer statistics.
    
    Permissions required: VIEW_REPORTS
    """
    # Base query
    query = db.query(Offer)
    
    # Apply filters
    if jd_id:
        query = query.join(Application).filter(Application.jd_id == jd_id)
    
    if client_id:
        query = query.join(Application).join(JobDescription).filter(
            JobDescription.client_id == client_id
        )
    
    if date_from:
        query = query.filter(Offer.sent_date >= date_from)
    
    if date_to:
        query = query.filter(Offer.sent_date <= date_to)
    
    # Count by status
    total_offers = query.count()
    sent_offers = query.filter(Offer.status == OfferStatus.SENT).count()
    accepted_offers = query.filter(Offer.status == OfferStatus.ACCEPTED).count()
    rejected_offers = query.filter(Offer.status == OfferStatus.REJECTED).count()
    negotiating_offers = query.filter(Offer.status == OfferStatus.NEGOTIATING).count()
    expired_offers = query.filter(Offer.status == OfferStatus.EXPIRED).count()
    
    # Calculate acceptance rate
    total_decided = accepted_offers + rejected_offers
    acceptance_rate = (accepted_offers / total_decided * 100) if total_decided > 0 else 0
    
    # Calculate average CTC
    avg_ctc = query.with_entities(func.avg(Offer.annual_ctc)).scalar() or 0.0
    
    return OfferStats(
        total_offers=total_offers,
        sent_offers=sent_offers,
        accepted_offers=accepted_offers,
        rejected_offers=rejected_offers,
        negotiating_offers=negotiating_offers,
        expired_offers=expired_offers,
        acceptance_rate=round(acceptance_rate, 2),
        average_ctc=round(avg_ctc, 2),
        average_negotiation_increase=0.0  # TODO: Calculate
    )


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_OFFER))
):
    """
    Delete an offer (draft only).
    
    Permissions required: DELETE_OFFER
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    # Can only delete draft offers
    if offer.status != OfferStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft offers"
        )
    
    db.delete(offer)
    db.commit()
    
    return None
