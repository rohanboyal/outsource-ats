"""
Pitch schemas for request/response validation - FIXED TO MATCH DATABASE
Replace: backend/app/schemas/pitch.py
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime

from app.models.pitch import PitchStatus


# ============================================================================
# PITCH SCHEMAS - MATCHING YOUR DATABASE
# ============================================================================

class PitchBase(BaseModel):
    """Base pitch schema."""
    pitch_title: str = Field(..., min_length=1, max_length=255)  # ✅ Changed from 'title'
    description: Optional[str] = None  # ✅ Made optional to match DB
    
    # Proposed roles (JSON in DB)
    proposed_roles: Optional[List[dict]] = None
    
    # Rate card (JSON in DB)
    rate_card: Optional[dict] = None
    
    # Headcount
    expected_headcount: Optional[int] = Field(None, ge=1)
    
    # Status
    status: PitchStatus = Field(default=PitchStatus.DRAFT)
    
    # Notes
    notes: Optional[str] = None


class PitchCreate(PitchBase):
    """Schema for creating a pitch."""
    client_id: int = Field(..., gt=0)


class PitchUpdate(BaseModel):
    """Schema for updating pitch."""
    pitch_title: Optional[str] = Field(None, min_length=1, max_length=255)  # ✅ Changed from 'title'
    description: Optional[str] = None
    proposed_roles: Optional[List[dict]] = None
    rate_card: Optional[dict] = None
    expected_headcount: Optional[int] = Field(None, ge=1)
    status: Optional[PitchStatus] = None
    notes: Optional[str] = None


class PitchStatusUpdate(BaseModel):
    """Schema for updating pitch status."""
    status: PitchStatus
    notes: Optional[str] = None


class PitchSend(BaseModel):
    """Schema for sending pitch to client."""
    notes: Optional[str] = None


class PitchReject(BaseModel):
    """Schema for rejecting pitch."""
    rejection_reason: str = Field(..., min_length=1)  # ✅ Uses actual DB field


class PitchResponse(BaseModel):
    """Schema for pitch response - MATCHES DATABASE EXACTLY."""
    id: int
    client_id: int
    
    # ✅ Using exact database column names
    pitch_title: str
    description: Optional[str]
    proposed_roles: Optional[List[dict]]
    rate_card: Optional[dict]
    expected_headcount: Optional[int]
    
    # Status
    status: PitchStatus
    
    # Dates - ✅ Only what exists in DB
    sent_date: Optional[date]
    decision_date: Optional[date]
    
    # Notes
    notes: Optional[str]
    rejection_reason: Optional[str]
    
    # Metadata
    created_by: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class PitchListResponse(BaseModel):
    """Schema for paginated pitch list."""
    pitches: List[PitchResponse]
    total: int
    page: int
    page_size: int
    pages: int


class PitchDetailResponse(PitchResponse):
    """Schema for detailed pitch response."""
    # Client info
    client_name: Optional[str] = None
    client_industry: Optional[str] = None
    
    # Statistics
    total_jds_created: int = 0
    active_jds: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class PitchStats(BaseModel):
    """Schema for pitch statistics."""
    total_pitches: int = 0
    draft_pitches: int = 0
    sent_pitches: int = 0
    approved_pitches: int = 0
    rejected_pitches: int = 0
    converted_pitches: int = 0
    
    approval_rate: float = 0.0
    conversion_rate: float = 0.0
    average_response_days: float = 0.0
