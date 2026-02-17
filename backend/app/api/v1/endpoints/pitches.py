"""
Pitch management endpoints - FIXED TO MATCH DATABASE
Replace: backend/app/api/v1/endpoints/pitches.py
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import date

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
    PitchReject,
    PitchStats
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker

router = APIRouter()


@router.post("", response_model=PitchResponse, status_code=status.HTTP_201_CREATED)
async def create_pitch(
    pitch_data: PitchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.CREATE_PITCH))
):
    """Create a new pitch."""
    # Verify client exists
    client = db.query(Client).filter(Client.id == pitch_data.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {pitch_data.client_id} not found"
        )
    
    # ✅ Create pitch using EXACT database column names
    new_pitch = Pitch(
        client_id=pitch_data.client_id,
        pitch_title=pitch_data.pitch_title,  # ✅ Correct field name
        description=pitch_data.description,
        proposed_roles=pitch_data.proposed_roles,
        rate_card=pitch_data.rate_card,
        expected_headcount=pitch_data.expected_headcount,
        status=pitch_data.status,
        notes=pitch_data.notes,
        created_by=current_user.id
    )
    
    db.add(new_pitch)
    db.commit()
    db.refresh(new_pitch)
    
    return new_pitch


@router.get("", response_model=PitchListResponse)
async def list_pitches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client_id: Optional[int] = None,
    status: Optional[PitchStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_PITCH))
):
    """List all pitches."""
    query = db.query(Pitch).filter(Pitch.deleted_at.is_(None))
    
    if client_id:
        query = query.filter(Pitch.client_id == client_id)
    
    if status:
        query = query.filter(Pitch.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Pitch.pitch_title.ilike(search_term),
                Pitch.description.ilike(search_term)
            )
        )
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
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
    """Get pitch details."""
    pitch = db.query(Pitch).filter(
        Pitch.id == pitch_id,
        Pitch.deleted_at.is_(None)
    ).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    # Get client info
    client = db.query(Client).filter(Client.id == pitch.client_id).first()
    
    # Get JD statistics
    total_jds = db.query(func.count(JobDescription.id)).filter(
        JobDescription.pitch_id == pitch_id
    ).scalar() or 0
    
    active_jds = db.query(func.count(JobDescription.id)).filter(
        JobDescription.pitch_id == pitch_id,
        JobDescription.status == JDStatus.OPEN
    ).scalar() or 0
    
    response = PitchDetailResponse(
        **pitch.__dict__,
        client_name=client.company_name if client else None,
        client_industry=client.industry if client else None,
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
    """Update pitch."""
    pitch = db.query(Pitch).filter(
        Pitch.id == pitch_id,
        Pitch.deleted_at.is_(None)
    ).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    # Can only update draft pitches
    if pitch.status != PitchStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update draft pitches"
        )
    
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
    """Update pitch status."""
    pitch = db.query(Pitch).filter(
        Pitch.id == pitch_id,
        Pitch.deleted_at.is_(None)
    ).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    pitch.status = status_update.status
    
    # ✅ Set decision_date when approved/rejected
    if status_update.status in [PitchStatus.APPROVED, PitchStatus.REJECTED]:
        pitch.decision_date = date.today()
    
    if status_update.notes:
        pitch.notes = f"{pitch.notes or ''}\n{status_update.notes}"
    
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
    """Send pitch to client."""
    pitch = db.query(Pitch).filter(
        Pitch.id == pitch_id,
        Pitch.deleted_at.is_(None)
    ).first()
    
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
    
    pitch.status = PitchStatus.SENT
    pitch.sent_date = date.today()
    
    if send_data.notes:
        pitch.notes = f"{pitch.notes or ''}\nSent: {send_data.notes}"
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.post("/{pitch_id}/approve", response_model=PitchResponse)
async def approve_pitch(
    pitch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.APPROVE_PITCH))
):
    """Approve pitch."""
    pitch = db.query(Pitch).filter(
        Pitch.id == pitch_id,
        Pitch.deleted_at.is_(None)
    ).first()
    
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
    
    pitch.status = PitchStatus.APPROVED
    pitch.decision_date = date.today()
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.post("/{pitch_id}/reject", response_model=PitchResponse)
async def reject_pitch(
    pitch_id: int,
    reject_data: PitchReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.UPDATE_PITCH))
):
    """Reject pitch."""
    pitch = db.query(Pitch).filter(
        Pitch.id == pitch_id,
        Pitch.deleted_at.is_(None)
    ).first()
    
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
    
    pitch.status = PitchStatus.REJECTED
    pitch.decision_date = date.today()
    pitch.rejection_reason = reject_data.rejection_reason
    
    db.commit()
    db.refresh(pitch)
    
    return pitch


@router.delete("/{pitch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pitch(
    pitch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.DELETE_PITCH))
):
    """Delete pitch (soft delete)."""
    pitch = db.query(Pitch).filter(
        Pitch.id == pitch_id,
        Pitch.deleted_at.is_(None)
    ).first()
    
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pitch with ID {pitch_id} not found"
        )
    
    if pitch.status != PitchStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft pitches"
        )
    
    # Soft delete
    from datetime import datetime
    pitch.deleted_at = datetime.now()
    
    db.commit()
    
    return None
