"""
Joining/Onboarding schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime

from app.models.joining import JoiningStatus


# ============================================================================
# JOINING SCHEMAS
# ============================================================================

class JoiningBase(BaseModel):
    """Base joining schema."""
    expected_joining_date: date
    actual_joining_date: Optional[date] = None
    employee_id: Optional[str] = Field(None, max_length=50)
    
    # Status
    status: JoiningStatus = Field(default=JoiningStatus.CONFIRMED)
    
    # Documentation
    documents_submitted: Optional[dict] = None
    bgv_status: Optional[str] = Field(None, max_length=50)
    bgv_completion_date: Optional[date] = None
    
    # Onboarding
    onboarding_status: Optional[dict] = None
    
    # Replacement
    # replacement_required: bool = Field(default=False)
    replacement_reason: Optional[str] = None
    
    # Notes
    remarks: Optional[str] = None


class JoiningCreate(JoiningBase):
    """Schema for creating a joining record."""
    application_id: int = Field(..., gt=0)


class JoiningUpdate(BaseModel):
    """Schema for updating joining."""
    expected_joining_date: Optional[date] = None
    actual_joining_date: Optional[date] = None
    employee_id: Optional[str] = Field(None, max_length=50)
    
    status: Optional[JoiningStatus] = None
    
    documents_submitted: Optional[dict] = None
    bgv_status: Optional[str] = Field(None, max_length=50)
    bgv_completion_date: Optional[date] = None
    
    onboarding_status: Optional[dict] = None
    
    replacement_required: Optional[bool] = None
    replacement_reason: Optional[str] = None
    
    remarks: Optional[str] = None


class JoiningStatusUpdate(BaseModel):
    """Schema for updating joining status."""
    status: JoiningStatus
    notes: Optional[str] = None


class JoiningDocumentUpdate(BaseModel):
    """Schema for updating documents."""
    documents_submitted: dict
    notes: Optional[str] = None


class JoiningBGVUpdate(BaseModel):
    """Schema for updating BGV status."""
    bgv_status: str = Field(..., max_length=50)
    bgv_completion_date: Optional[date] = None
    notes: Optional[str] = None


class JoiningOnboardingUpdate(BaseModel):
    """Schema for updating onboarding status."""
    onboarding_status: dict
    notes: Optional[str] = None


class JoiningNoShow(BaseModel):
    """Schema for marking no-show."""
    reason: Optional[str] = None
    replacement_required: bool = Field(default=True)


class JoiningResponse(BaseModel):
    """Schema for joining response."""
    id: int
    application_id: int
    
    expected_joining_date: date
    actual_joining_date: Optional[date]
    employee_id: Optional[str]
    
    status: JoiningStatus
    
    # documents_submitted: Optional[dict]
    # bgv_status: Optional[str]
    # bgv_completion_date: Optional[date]
    
    # onboarding_status: Optional[dict]
    
    # replacement_required: bool
    # replacement_reason: Optional[str]
    notes: Optional[str]
    
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class JoiningListResponse(BaseModel):
    """Schema for paginated joining list."""
    joinings: List[JoiningResponse]
    total: int
    page: int
    page_size: int
    pages: int


class JoiningDetailResponse(JoiningResponse):
    """Schema for detailed joining response."""
    # Candidate info
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    
    # JD info
    jd_title: Optional[str] = None
    jd_code: Optional[str] = None
    designation: Optional[str] = None
    
    # Client info
    client_name: Optional[str] = None
    
    # Offer info
    offered_ctc: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class JoiningStats(BaseModel):
    """Schema for joining statistics."""
    total_joinings: int = 0
    confirmed_joinings: int = 0
    completed_joinings: int = 0
    no_show_count: int = 0
    delayed_count: int = 0
    replacement_required_count: int = 0
    
    joining_rate: float = 0.0
    no_show_rate: float = 0.0
    average_days_to_join: float = 0.0


class JoiningUpcoming(BaseModel):
    """Schema for upcoming joinings."""
    today: int = 0
    this_week: int = 0
    this_month: int = 0
    next_month: int = 0
