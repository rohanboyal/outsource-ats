"""
Pitch management endpoints for business development.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, date

from app.db.session import get_db
from app.models.user import User
from app.models.client import Client
from app.models.pitch import Pitch, PitchStatus
from app.models.job_description import JobDescription, JDStatus
from app.schemas.pitch import (
    PitchCreate,
    PitchUpdate,
    PitchResponse,
    PitchListResponse,
    PitchDetailResponse,
    PitchStatusUpdate,
    PitchSend,
    PitchFeedback,
    PitchConvert,
    PitchStats
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker


router = APIRouter()


# ============================================================================
# PITCH ENDPOINTS
# ============================================================================

@router.post("", response_model=PitchResponse, status_code=status.HTTP_201_CREATED)
async def create_pitch(
    pitch_data: PitchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_PITCH))
):
    """
    Create a new pitch for a client.
    
    Permissions required: CREATE_PITCH
    """
    # Verify client exists
    client = db.query(Client).filter(Client.id == pitch_data.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {pitch_data.client_id} not found"
        )
    
    # Verify BD person if provided
    if pitch_data.bd_person_id:
        bd_person = db.query(User).filter(User.id == pitch_data.bd_person_id).first()
        if not bd_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"BD person with ID {pitch_data.bd_person_id} not found"
            )
    
    # Create pitch
    new_pitch = Pitch(
        client_id=pitch_data.client_id,
        bd_person_id=pitch_data.bd_person_id,
        title=pitch_data.title,
        description=pitch_data.description,
        proposed_roles=pitch_data.proposed_roles,
        rate_card=pitch_data.rate_card,
        expected_start_date=pitch_data.expected_start_date,
        expected_headcount=pitch_data.expected_headcount,
        status=pitch_data.status,
        special_requirements=pitch_data.special_requirements,
        terms_conditions=pitch_data.terms_conditions,
        notes=pitch_data.notes,
        created_by=current_user.id
    )
    
    db.add(new_pitch)
    db.commit()
    db.refresh(new_pitch)
    
    return new_pitch


@router.get("", response_model=PitchListResponse)
async def list_pitches(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    bd_person_id: Optional[int] = Query(None, description="Filter by BD person"),
    status: Optional[PitchStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by title or description"),
    sent_from: Optional[date] = Query(None, description="Sent from date"),
    sent_to: Optional[date] = Query(None, description="Sent to date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_PITCH))
):
    """
    List all pitches with pagination and filters.
    
    Permissions required: VIEW_PITCH
    """
    # Base query
    query = db.query(Pitch)
    
    # Apply filters
    if client_id:
        query = query.filter(Pitch.client_id == client_id)
    
    if bd_person_id:
        query = query.filter(Pitch.bd_person_id == bd_person_id)
    
    if status:
        query = query.filter(Pitch.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Pitch.title.ilike(search_term),
                Pitch.description.ilike(search_term)
            )
        )
    
    if sent_from:
        query = query.filter(Pitch.sent_date >= sent_from)
    
    if sent_to:
        query = query.filter(Pitch.sent_date <= sent_to)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results
    pitches = query.order_by(Pitch.created_at.desc()).offset(offset).limit(page_size).all()
    
    return PitchListResponse(
        pitches=pitches,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/{pitch_id}", response_model=PitchDetailResponse)
async def get_pitch(
    pitch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_PITCH))
):
    """
    Get pitch details by ID.
    
    Permissions required: VIEW_PITCH
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    # Get client and BD person info
    client = db.query(Client).filter(Client.id == pitch.client_id).first()
    bd_person = db.query(User).filter(User.id == pitch.bd_person_id).first() if pitch.bd_person_id else None
    
    # Get JD statistics
    total_jds = db.query(func.count(JobDescription.id)).filter(
        JobDescription.pitch_id == pitch_id
    ).scalar() or 0
    
    active_jds = db.query(func.count(JobDescription.id)).filter(
        JobDescription.pitch_id == pitch_id,
        JobDescription.status == JDStatus.OPEN
    ).scalar() or 0
    
    # Build detailed response
    response = PitchDetailResponse(
        **pitch.__dict__,
        client_name=client.company_name if client else None,
        client_industry=client.industry if client else None,
        bd_person_name=bd_person.full_name if bd_person else None,
        total_jds_created=total_jds,
        active_jds=active_jds
    )
    
    return response


@router.put("/{pitch_id}", response_model=PitchResponse)
async def update_pitch(
    pitch_id: int,
    pitch_data: PitchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_PITCH))
):
    """
    Update pitch information.
    
    Permissions required: UPDATE_PITCH
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    # Can only update draft pitches
    if pitch.status != PitchStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update pitch with status: {pitch.status.value}"
        )
    
    # Update fields
    update_data = pitch_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pitch, field, value)
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.patch("/{pitch_id}/status", response_model=PitchResponse)
async def update_pitch_status(
    pitch_id: int,
    status_update: PitchStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_PITCH))
):
    """
    Update pitch status.
    
    Permissions required: UPDATE_PITCH
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    old_status = pitch.status
    new_status = status_update.status
    
    # Update status and dates
    pitch.status = new_status
    
    if new_status == PitchStatus.APPROVED:
        pitch.approved_date = date.today()
    
    if new_status == PitchStatus.REJECTED:
        pitch.rejected_date = date.today()
    
    if new_status == PitchStatus.CONVERTED:
        # Check if JDs exist
        jd_count = db.query(JobDescription).filter(JobDescription.pitch_id == pitch_id).count()
        if jd_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot mark as converted without creating JDs first"
            )
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.post("/{pitch_id}/send", response_model=PitchResponse)
async def send_pitch(
    pitch_id: int,
    send_data: PitchSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.SEND_PITCH))
):
    """
    Send pitch to client.
    
    Permissions required: SEND_PITCH
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    if pitch.status != PitchStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only send draft pitches"
        )
    
    # Update status
    pitch.status = PitchStatus.SENT
    pitch.sent_date = date.today()
    
    if send_data.notes:
        pitch.notes = f"{pitch.notes or ''}\nSent: {send_data.notes}"
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.post("/{pitch_id}/feedback", response_model=PitchResponse)
async def add_client_feedback(
    pitch_id: int,
    feedback_data: PitchFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_PITCH))
):
    """
    Add client feedback to pitch.
    
    Permissions required: UPDATE_PITCH
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    if pitch.status != PitchStatus.SENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only add feedback to sent pitches"
        )
    
    # Update feedback
    pitch.client_feedback = feedback_data.feedback
    pitch.response_date = feedback_data.client_response_date or date.today()
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.post("/{pitch_id}/approve", response_model=PitchResponse)
async def approve_pitch(
    pitch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.APPROVE_PITCH))
):
    """
    Approve pitch from client.
    
    Permissions required: APPROVE_PITCH
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    if pitch.status != PitchStatus.SENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only approve sent pitches"
        )
    
    # Update status
    pitch.status = PitchStatus.APPROVED
    pitch.approved_date = date.today()
    
    if not pitch.response_date:
        pitch.response_date = date.today()
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.post("/{pitch_id}/reject", response_model=PitchResponse)
async def reject_pitch(
    pitch_id: int,
    reason: Optional[str] = Query(None, description="Rejection reason"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_PITCH))
):
    """
    Reject pitch from client.
    
    Permissions required: UPDATE_PITCH
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    if pitch.status != PitchStatus.SENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only reject sent pitches"
        )
    
    # Update status
    pitch.status = PitchStatus.REJECTED
    pitch.rejected_date = date.today()
    
    if not pitch.response_date:
        pitch.response_date = date.today()
    
    if reason:
        pitch.client_feedback = f"Rejected: {reason}"
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.post("/{pitch_id}/convert", response_model=dict)
async def convert_to_jds(
    pitch_id: int,
    convert_data: PitchConvert,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_JD))
):
    """
    Convert pitch to job descriptions.
    
    Permissions required: CREATE_JD
    
    This creates JD records from the approved pitch.
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    if pitch.status != PitchStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only convert approved pitches"
        )
    
    # Create JDs from selected roles
    created_jds = []
    for role in convert_data.selected_roles:
        # Generate JD code
        client = db.query(Client).filter(Client.id == pitch.client_id).first()
        client_prefix = client.company_name[:3].upper() if client else "JD"
        count = db.query(JobDescription).filter(JobDescription.client_id == pitch.client_id).count()
        jd_code = f"{client_prefix}_{count + 1:04d}"
        
        # Create JD
        new_jd = JobDescription(
            jd_code=jd_code,
            client_id=pitch.client_id,
            pitch_id=pitch_id,
            title=role.get('title', 'Untitled'),
            description=role.get('description', pitch.description),
            required_skills=role.get('key_skills', []),
            experience_min=role.get('experience_min'),
            experience_max=role.get('experience_max'),
            open_positions=role.get('headcount', 1),
            filled_positions=0,
            status=JDStatus.DRAFT,
            sla_days=pitch.client.default_sla_days if pitch.client else 7,
            version=1,
            created_by=current_user.id
        )
        
        db.add(new_jd)
        db.flush()
        created_jds.append(new_jd.id)
    
    # Update pitch status to converted
    pitch.status = PitchStatus.CONVERTED
    
    db.commit()
    
    return {
        "message": f"Successfully created {len(created_jds)} JDs from pitch",
        "jd_ids": created_jds,
        "pitch_id": pitch_id
    }


@router.get("/{pitch_id}/jds", response_model=List[dict])
async def get_pitch_jds(
    pitch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_JD))
):
    """
    Get all JDs created from this pitch.
    
    Permissions required: VIEW_JD
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    # Get JDs
    jds = db.query(JobDescription).filter(JobDescription.pitch_id == pitch_id).all()
    
    return [
        {
            "id": jd.id,
            "jd_code": jd.jd_code,
            "title": jd.title,
            "status": jd.status.value,
            "open_positions": jd.open_positions,
            "filled_positions": jd.filled_positions,
            "created_at": jd.created_at
        }
        for jd in jds
    ]


@router.get("/stats/overview", response_model=PitchStats)
async def get_pitch_stats(
    client_id: Optional[int] = Query(None, description="Filter by client"),
    bd_person_id: Optional[int] = Query(None, description="Filter by BD person"),
    date_from: Optional[date] = Query(None, description="From date"),
    date_to: Optional[date] = Query(None, description="To date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """
    Get pitch statistics.
    
    Permissions required: VIEW_REPORTS
    """
    # Base query
    query = db.query(Pitch)
    
    # Apply filters
    if client_id:
        query = query.filter(Pitch.client_id == client_id)
    
    if bd_person_id:
        query = query.filter(Pitch.bd_person_id == bd_person_id)
    
    if date_from:
        query = query.filter(Pitch.sent_date >= date_from)
    
    if date_to:
        query = query.filter(Pitch.sent_date <= date_to)
    
    # Count by status
    total_pitches = query.count()
    draft_pitches = query.filter(Pitch.status == PitchStatus.DRAFT).count()
    sent_pitches = query.filter(Pitch.status == PitchStatus.SENT).count()
    approved_pitches = query.filter(Pitch.status == PitchStatus.APPROVED).count()
    rejected_pitches = query.filter(Pitch.status == PitchStatus.REJECTED).count()
    converted_pitches = query.filter(Pitch.status == PitchStatus.CONVERTED).count()
    
    # Calculate rates
    total_decided = approved_pitches + rejected_pitches
    approval_rate = (approved_pitches / total_decided * 100) if total_decided > 0 else 0
    
    total_approved_converted = approved_pitches + converted_pitches
    conversion_rate = (converted_pitches / total_approved_converted * 100) if total_approved_converted > 0 else 0
    
    # Calculate average response days
    avg_days = query.filter(
        Pitch.sent_date.isnot(None),
        Pitch.response_date.isnot(None)
    ).with_entities(
        func.avg(func.datediff(Pitch.response_date, Pitch.sent_date))
    ).scalar() or 0.0
    
    return PitchStats(
        total_pitches=total_pitches,
        draft_pitches=draft_pitches,
        sent_pitches=sent_pitches,
        approved_pitches=approved_pitches,
        rejected_pitches=rejected_pitches,
        converted_pitches=converted_pitches,
        approval_rate=round(approval_rate, 2),
        conversion_rate=round(conversion_rate, 2),
        average_response_days=round(avg_days, 2)
    )


@router.delete("/{pitch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pitch(
    pitch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_PITCH))
):
    """
    Delete a pitch (draft only).
    
    Permissions required: DELETE_PITCH
    """
    pitch = db.query(Pitch).filter(Pitch.id == pitch_id).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    # Can only delete draft pitches
    if pitch.status != PitchStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft pitches"
        )
    
    db.delete(pitch)
    db.commit()
    
    return None
