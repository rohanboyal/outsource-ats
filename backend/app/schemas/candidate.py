"""
Candidate schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict, validator
from typing import Optional, List
from datetime import datetime

from app.models.candidate import CandidateSource


# ============================================================================
# CANDIDATE SCHEMAS
# ============================================================================

class CandidateBase(BaseModel):
    """Base candidate schema."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    alternate_phone: Optional[str] = Field(None, max_length=20)
    
    # Current Employment
    current_company: Optional[str] = Field(None, max_length=255)
    current_designation: Optional[str] = Field(None, max_length=255)
    total_experience: Optional[float] = Field(None, ge=0, le=50)
    relevant_experience: Optional[float] = Field(None, ge=0, le=50)
    
    # Skills (JSON array of strings)
    skills: Optional[List[str]] = Field(default_factory=list)
    certifications: Optional[List[str]] = Field(default_factory=list)
    
    # Location
    current_location: Optional[str] = Field(None, max_length=255)
    preferred_locations: Optional[List[str]] = Field(default_factory=list)
    willing_to_relocate: bool = Field(default=False)
    
    # Availability
    notice_period_days: Optional[int] = Field(None, ge=0, le=365)
    serving_notice_period: bool = Field(default=False)
    
    # Compensation
    current_ctc: Optional[float] = Field(None, ge=0)
    expected_ctc: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="USD", max_length=10)
    
    # Source
    source: CandidateSource = Field(default=CandidateSource.DIRECT)
    source_details: Optional[str] = Field(None, max_length=255)
    
    # Social Links
    linkedin_url: Optional[str] = Field(None, max_length=500)
    github_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    
    # Education
    highest_education: Optional[str] = Field(None, max_length=100)
    education_details: Optional[List[dict]] = Field(default_factory=list)
    
    # Additional
    notes: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class CandidateCreate(CandidateBase):
    """Schema for creating a candidate."""
    pass


class CandidateUpdate(BaseModel):
    """Schema for updating candidate."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    alternate_phone: Optional[str] = Field(None, max_length=20)
    
    current_company: Optional[str] = Field(None, max_length=255)
    current_designation: Optional[str] = Field(None, max_length=255)
    total_experience: Optional[float] = Field(None, ge=0, le=50)
    relevant_experience: Optional[float] = Field(None, ge=0, le=50)
    
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    
    current_location: Optional[str] = Field(None, max_length=255)
    preferred_locations: Optional[List[str]] = None
    willing_to_relocate: Optional[bool] = None
    
    notice_period_days: Optional[int] = Field(None, ge=0, le=365)
    serving_notice_period: Optional[bool] = None
    
    current_ctc: Optional[float] = Field(None, ge=0)
    expected_ctc: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    
    source: Optional[CandidateSource] = None
    source_details: Optional[str] = Field(None, max_length=255)
    
    linkedin_url: Optional[str] = Field(None, max_length=500)
    github_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    
    highest_education: Optional[str] = Field(None, max_length=100)
    education_details: Optional[List[dict]] = None
    
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CandidateResponse(CandidateBase):
    """Schema for candidate response."""
    id: int
    resume_path: Optional[str] = None
    resume_original_name: Optional[str] = None
    resume_parsed_data: Optional[dict] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def full_name(self) -> str:
        """Get candidate's full name."""
        return f"{self.first_name} {self.last_name}"


class CandidateListResponse(BaseModel):
    """Schema for paginated candidate list."""
    candidates: List[CandidateResponse]
    total: int
    page: int
    page_size: int
    pages: int


class CandidateDetailResponse(CandidateResponse):
    """Schema for detailed candidate response with statistics."""
    total_applications: int = 0
    active_applications: int = 0
    interviews_scheduled: int = 0
    offers_received: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class CandidateDuplicateCheck(BaseModel):
    """Schema for duplicate candidate check."""
    email: EmailStr
    phone: Optional[str] = None
    
    
class CandidateDuplicateResponse(BaseModel):
    """Schema for duplicate check response."""
    is_duplicate: bool
    matching_candidates: List[CandidateResponse] = Field(default_factory=list)
    match_reasons: List[str] = Field(default_factory=list)