"""
Offer schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime

from app.models.offer import OfferStatus


# ============================================================================
# OFFER SCHEMAS
# ============================================================================

class OfferBase(BaseModel):
    """Base offer schema."""
    designation: str = Field(..., min_length=1, max_length=255)
    
    # Compensation
    annual_ctc: float = Field(..., gt=0)
    base_salary: Optional[float] = Field(None, gt=0)
    variable_pay: Optional[float] = Field(None, ge=0)
    bonus: Optional[float] = Field(None, ge=0)
    benefits: Optional[dict] = None
    
    # Dates
    joining_date: Optional[date] = None
    offer_valid_till: Optional[date] = None
    
    # Additional
    work_location: Optional[str] = Field(None, max_length=255)
    remarks: Optional[str] = None


class OfferCreate(OfferBase):
    """Schema for creating an offer."""
    application_id: int = Field(..., gt=0)


class OfferUpdate(BaseModel):
    """Schema for updating offer."""
    designation: Optional[str] = Field(None, min_length=1, max_length=255)
    
    annual_ctc: Optional[float] = Field(None, gt=0)
    base_salary: Optional[float] = Field(None, gt=0)
    variable_pay: Optional[float] = Field(None, ge=0)
    bonus: Optional[float] = Field(None, ge=0)
    benefits: Optional[dict] = None
    
    joining_date: Optional[date] = None
    offer_valid_till: Optional[date] = None
    
    work_location: Optional[str] = Field(None, max_length=255)
    remarks: Optional[str] = None


class OfferStatusUpdate(BaseModel):
    """Schema for updating offer status."""
    status: OfferStatus
    notes: Optional[str] = None


class OfferNegotiation(BaseModel):
    """Schema for offer negotiation."""
    candidate_counter_ctc: float = Field(..., gt=0)
    negotiation_notes: Optional[str] = None


class OfferRevision(BaseModel):
    """Schema for creating offer revision."""
    annual_ctc: float = Field(..., gt=0)
    base_salary: Optional[float] = Field(None, gt=0)
    variable_pay: Optional[float] = Field(None, ge=0)
    bonus: Optional[float] = Field(None, ge=0)
    benefits: Optional[dict] = None
    revision_reason: str = Field(..., min_length=1)


class OfferResponse(BaseModel):
    """Schema for offer response."""
    id: int
    offer_number: str
    application_id: int
    
    designation: str
    annual_ctc: float
    base_salary: Optional[float]
    variable_pay: Optional[float]
    bonus: Optional[float]
    benefits: Optional[dict]
    
    joining_date: Optional[date]
    offer_valid_till: Optional[date]
    work_location: Optional[str]
    
    status: OfferStatus
    sent_date: Optional[date]
    accepted_date: Optional[date]
    rejected_date: Optional[date]
    
    version: int
    parent_offer_id: Optional[int]
    revision_reason: Optional[str]
    
    remarks: Optional[str]
    
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class OfferListResponse(BaseModel):
    """Schema for paginated offer list."""
    offers: List[OfferResponse]
    total: int
    page: int
    page_size: int
    pages: int


class OfferDetailResponse(OfferResponse):
    """Schema for detailed offer response."""
    # Candidate info
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_current_ctc: Optional[float] = None
    candidate_expected_ctc: Optional[float] = None
    
    # JD info
    jd_title: Optional[str] = None
    jd_code: Optional[str] = None
    client_name: Optional[str] = None
    
    # History
    revisions_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class OfferStats(BaseModel):
    """Schema for offer statistics."""
    total_offers: int = 0
    sent_offers: int = 0
    accepted_offers: int = 0
    rejected_offers: int = 0
    negotiating_offers: int = 0
    expired_offers: int = 0
    
    acceptance_rate: float = 0.0
    average_ctc: float = 0.0
    average_negotiation_increase: float = 0.0
