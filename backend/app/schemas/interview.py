"""
Interview schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

from app.models.interview import InterviewMode, InterviewStatus, InterviewResult


# ============================================================================
# INTERVIEW SCHEMAS
# ============================================================================

class InterviewBase(BaseModel):
    """Base interview schema."""
    round_number: int = Field(..., ge=1, le=10)
    round_name: str = Field(..., min_length=1, max_length=100)
    scheduled_date: Optional[datetime] = None
    duration_minutes: int = Field(default=60, ge=15, le=480)
    
    # Interviewer
    interviewer_name: Optional[str] = Field(None, max_length=255)
    interviewer_email: Optional[EmailStr] = None
    interviewer_designation: Optional[str] = Field(None, max_length=100)
    is_client_interview: bool = Field(default=False)
    
    # Mode
    interview_mode: InterviewMode = Field(default=InterviewMode.VIDEO)
    meeting_link: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=255)
    
    # Additional notes
    additional_notes: Optional[str] = None


class InterviewCreate(InterviewBase):
    """Schema for creating an interview."""
    application_id: int = Field(..., gt=0)


class InterviewUpdate(BaseModel):
    """Schema for updating interview."""
    round_number: Optional[int] = Field(None, ge=1, le=10)
    round_name: Optional[str] = Field(None, min_length=1, max_length=100)
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    
    interviewer_name: Optional[str] = Field(None, max_length=255)
    interviewer_email: Optional[EmailStr] = None
    interviewer_designation: Optional[str] = Field(None, max_length=100)
    is_client_interview: Optional[bool] = None
    
    interview_mode: Optional[InterviewMode] = None
    meeting_link: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=255)
    
    status: Optional[InterviewStatus] = None
    additional_notes: Optional[str] = None


class InterviewFeedback(BaseModel):
    """Schema for submitting interview feedback."""
    feedback: str = Field(..., min_length=1)
    rating: Optional[int] = Field(None, ge=1, le=5)
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    result: InterviewResult
    next_round_scheduled: bool = Field(default=False)


class InterviewReschedule(BaseModel):
    """Schema for rescheduling interview."""
    new_scheduled_date: datetime
    reason: Optional[str] = None


class InterviewResponse(BaseModel):
    """Schema for interview response."""
    id: int
    application_id: int
    round_number: int
    round_name: str
    scheduled_date: Optional[datetime]
    duration_minutes: int
    
    interviewer_name: Optional[str]
    interviewer_email: Optional[str]
    interviewer_designation: Optional[str]
    is_client_interview: bool
    
    interview_mode: InterviewMode
    meeting_link: Optional[str]
    location: Optional[str]
    
    status: InterviewStatus
    feedback: Optional[str]
    rating: Optional[int]
    strengths: Optional[str]
    weaknesses: Optional[str]
    result: Optional[InterviewResult]
    
    next_round_scheduled: bool
    additional_notes: Optional[str]
    
    created_by: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class InterviewListResponse(BaseModel):
    """Schema for paginated interview list."""
    interviews: List[InterviewResponse]
    total: int
    page: int
    page_size: int
    pages: int


class InterviewDetailResponse(InterviewResponse):
    """Schema for detailed interview response."""
    # Candidate info
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    
    # JD info
    jd_title: Optional[str] = None
    jd_code: Optional[str] = None
    client_name: Optional[str] = None
    
    # Application status
    application_status: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class InterviewStats(BaseModel):
    """Schema for interview statistics."""
    total_scheduled: int = 0
    total_completed: int = 0
    total_cancelled: int = 0
    total_no_show: int = 0
    
    selected_count: int = 0
    rejected_count: int = 0
    on_hold_count: int = 0
    pending_count: int = 0
    
    average_rating: float = 0.0
    selection_rate: float = 0.0
