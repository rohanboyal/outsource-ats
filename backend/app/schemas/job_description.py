"""
Job Description schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

from app.models.job_description import ContractType, JDStatus, JDPriority


# ============================================================================
# JOB DESCRIPTION SCHEMAS
# ============================================================================

class JobDescriptionBase(BaseModel):
    """Base job description schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=10)
    
    # Requirements
    required_skills: Optional[List[str]] = Field(default_factory=list)
    preferred_skills: Optional[List[str]] = Field(default_factory=list)
    experience_min: Optional[float] = Field(None, ge=0, le=50)
    experience_max: Optional[float] = Field(None, ge=0, le=50)
    
    # Location and Work Details
    location: Optional[str] = Field(None, max_length=255)
    work_mode: Optional[str] = Field(None, max_length=50)  # remote, hybrid, onsite
    contract_type: ContractType = Field(default=ContractType.FULL_TIME)
    
    # Position Details
    open_positions: int = Field(default=1, ge=1)
    
    # Status and Priority
    status: JDStatus = Field(default=JDStatus.DRAFT)
    priority: JDPriority = Field(default=JDPriority.MEDIUM)
    
    # SLA
    sla_days: Optional[int] = Field(None, ge=1, le=365)
    
    # Compensation
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="USD", max_length=10)
    benefits: Optional[str] = None


class JobDescriptionCreate(JobDescriptionBase):
    """Schema for creating a job description."""
    client_id: int = Field(..., gt=0)
    pitch_id: Optional[int] = Field(None, gt=0)
    assigned_recruiter_id: Optional[int] = Field(None, gt=0)


class JobDescriptionUpdate(BaseModel):
    """Schema for updating job description."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    experience_min: Optional[float] = Field(None, ge=0, le=50)
    experience_max: Optional[float] = Field(None, ge=0, le=50)
    
    location: Optional[str] = Field(None, max_length=255)
    work_mode: Optional[str] = Field(None, max_length=50)
    contract_type: Optional[ContractType] = None
    
    open_positions: Optional[int] = Field(None, ge=1)
    
    status: Optional[JDStatus] = None
    priority: Optional[JDPriority] = None
    
    assigned_recruiter_id: Optional[int] = None
    sla_days: Optional[int] = Field(None, ge=1, le=365)
    
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    benefits: Optional[str] = None


class JobDescriptionResponse(JobDescriptionBase):
    """Schema for job description response."""
    id: int
    jd_code: str
    client_id: int
    pitch_id: Optional[int]
    assigned_recruiter_id: Optional[int]
    filled_positions: int
    version: int
    parent_jd_id: Optional[int]
    created_by: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def remaining_positions(self) -> int:
        """Calculate remaining positions."""
        return max(0, self.open_positions - self.filled_positions)


class JobDescriptionListResponse(BaseModel):
    """Schema for paginated JD list."""
    job_descriptions: List[JobDescriptionResponse]
    total: int
    page: int
    page_size: int
    pages: int


class JobDescriptionDetailResponse(JobDescriptionResponse):
    """Schema for detailed JD response with statistics."""
    total_applications: int = 0
    active_applications: int = 0
    submitted_applications: int = 0
    interviewed_candidates: int = 0
    offers_extended: int = 0
    positions_filled: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class JobDescriptionAssignment(BaseModel):
    """Schema for assigning JD to recruiter."""
    recruiter_id: int = Field(..., gt=0)


class JobDescriptionStatusUpdate(BaseModel):
    """Schema for updating JD status."""
    status: JDStatus
    notes: Optional[str] = None
