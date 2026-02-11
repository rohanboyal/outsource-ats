"""
Pitch schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime

from app.models.pitch import PitchStatus


# ============================================================================
# PITCH SCHEMAS
# ============================================================================

class PitchBase(BaseModel):
    """Base pitch schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=10)
    
    # Proposed roles
    proposed_roles: Optional[List[dict]] = Field(
        default_factory=list,
        description="List of roles being pitched"
    )
    
    # Rate card
    rate_card: Optional[dict] = Field(
        None,
        description="Pricing information per role"
    )
    
    # Timeline
    expected_start_date: Optional[date] = None
    expected_headcount: Optional[int] = Field(None, ge=1)
    
    # Status
    status: PitchStatus = Field(default=PitchStatus.DRAFT)
    
    # Additional info
    special_requirements: Optional[str] = None
    terms_conditions: Optional[str] = None
    notes: Optional[str] = None


class PitchCreate(PitchBase):
    """Schema for creating a pitch."""
    client_id: int = Field(..., gt=0)
    bd_person_id: Optional[int] = Field(None, gt=0, description="BD/Sales person ID")


class PitchUpdate(BaseModel):
    """Schema for updating pitch."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    
    proposed_roles: Optional[List[dict]] = None
    rate_card: Optional[dict] = None
    
    expected_start_date: Optional[date] = None
    expected_headcount: Optional[int] = Field(None, ge=1)
    
    status: Optional[PitchStatus] = None
    
    special_requirements: Optional[str] = None
    terms_conditions: Optional[str] = None
    notes: Optional[str] = None


class PitchStatusUpdate(BaseModel):
    """Schema for updating pitch status."""
    status: PitchStatus
    notes: Optional[str] = None


class PitchSend(BaseModel):
    """Schema for sending pitch to client."""
    sent_to_contact_id: Optional[int] = Field(None, description="Client contact ID")
    notes: Optional[str] = None


class PitchFeedback(BaseModel):
    """Schema for client feedback."""
    feedback: str = Field(..., min_length=1)
    client_response_date: Optional[date] = None


class PitchConvert(BaseModel):
    """Schema for converting pitch to JDs."""
    selected_roles: List[dict] = Field(..., min_items=1, description="Roles to convert to JDs")
    notes: Optional[str] = None


class PitchResponse(BaseModel):
    """Schema for pitch response."""
    id: int
    client_id: int
    bd_person_id: Optional[int]
    
    title: str
    description: str
    
    proposed_roles: Optional[List[dict]]
    rate_card: Optional[dict]
    
    expected_start_date: Optional[date]
    expected_headcount: Optional[int]
    
    status: PitchStatus
    sent_date: Optional[date]
    response_date: Optional[date]
    approved_date: Optional[date]
    rejected_date: Optional[date]
    
    special_requirements: Optional[str]
    terms_conditions: Optional[str]
    client_feedback: Optional[str]
    notes: Optional[str]
    
    created_by: int
    created_at: datetime
    updated_at: datetime
    
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
    
    # BD person info
    bd_person_name: Optional[str] = None
    
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


class PitchRoleTemplate(BaseModel):
    """Template for a role in pitch."""
    title: str
    description: str
    headcount: int
    experience_range: str
    key_skills: List[str]
    rate_per_month: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)
