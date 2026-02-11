"""
Application schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date

from app.models.application import ApplicationStatus, SLAStatus


# ============================================================================
# APPLICATION SCHEMAS
# ============================================================================

class ApplicationBase(BaseModel):
    """Base application schema."""
    screening_notes: Optional[str] = None
    internal_rating: Optional[int] = Field(None, ge=1, le=5)


class ApplicationCreate(BaseModel):
    """Schema for creating an application."""
    candidate_id: int = Field(..., gt=0)
    jd_id: int = Field(..., gt=0)
    screening_notes: Optional[str] = None
    internal_rating: Optional[int] = Field(None, ge=1, le=5)
    status: ApplicationStatus = Field(default=ApplicationStatus.SOURCED)


class ApplicationUpdate(BaseModel):
    """Schema for updating application."""
    screening_notes: Optional[str] = None
    internal_rating: Optional[int] = Field(None, ge=1, le=5)
    substatus: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    """Schema for updating application status."""
    status: ApplicationStatus
    notes: Optional[str] = None


class ApplicationSubmitToClient(BaseModel):
    """Schema for submitting application to client."""
    submission_notes: Optional[str] = None


class ApplicationReject(BaseModel):
    """Schema for rejecting application."""
    rejection_reason: str = Field(..., min_length=1)
    rejection_stage: Optional[str] = Field(None, max_length=50)


class ApplicationResponse(BaseModel):
    """Schema for application response."""
    id: int
    candidate_id: int
    jd_id: int
    status: ApplicationStatus
    substatus: Optional[str]
    screening_notes: Optional[str]
    internal_rating: Optional[int]
    screened_by: Optional[int]
    screened_at: Optional[datetime]
    submitted_to_client_date: Optional[date]
    client_submission_notes: Optional[str]
    sla_start_date: Optional[date]
    sla_end_date: Optional[date]
    sla_status: Optional[SLAStatus]
    rejection_reason: Optional[str]
    rejection_stage: Optional[str]
    rejected_by: Optional[str]
    rejected_at: Optional[datetime]
    notes: Optional[str]
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ApplicationListResponse(BaseModel):
    """Schema for paginated application list."""
    applications: List[ApplicationResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ApplicationDetailResponse(ApplicationResponse):
    """Schema for detailed application response."""
    # Candidate info
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    
    # JD info
    jd_title: Optional[str] = None
    jd_code: Optional[str] = None
    client_name: Optional[str] = None
    
    # Statistics
    total_interviews: int = 0
    completed_interviews: int = 0
    pending_interviews: int = 0
    offers_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class ApplicationStatusHistoryResponse(BaseModel):
    """Schema for application status history."""
    id: int
    application_id: int
    from_status: Optional[str]
    to_status: str
    changed_by: int
    notes: Optional[str]
    changed_at: datetime
    
    # User info
    changed_by_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ApplicationPipelineStats(BaseModel):
    """Schema for pipeline statistics."""
    sourced: int = 0
    screened: int = 0
    submitted: int = 0
    interviewing: int = 0
    offered: int = 0
    joined: int = 0
    rejected: int = 0
    withdrawn: int = 0
    total: int = 0
    
    # Conversion rates
    screening_to_submission_rate: float = 0.0
    submission_to_interview_rate: float = 0.0
    interview_to_offer_rate: float = 0.0
    offer_to_joining_rate: float = 0.0


class ApplicationBulkUpdate(BaseModel):
    """Schema for bulk status update."""
    application_ids: List[int] = Field(..., min_items=1)
    status: ApplicationStatus
    notes: Optional[str] = None
