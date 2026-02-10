"""
Client schemas for request/response validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

from app.models.client import ClientStatus


# ============================================================================
# CLIENT CONTACT SCHEMAS
# ============================================================================

class ClientContactBase(BaseModel):
    """Base client contact schema."""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    designation: Optional[str] = Field(None, max_length=100)
    is_primary: bool = Field(default=False)


class ClientContactCreate(ClientContactBase):
    """Schema for creating a client contact."""
    pass


class ClientContactUpdate(BaseModel):
    """Schema for updating client contact."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    designation: Optional[str] = Field(None, max_length=100)
    is_primary: Optional[bool] = None


class ClientContactResponse(ClientContactBase):
    """Schema for client contact response."""
    id: int
    client_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# CLIENT SCHEMAS
# ============================================================================

class ClientBase(BaseModel):
    """Base client schema."""
    company_name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    status: ClientStatus = Field(default=ClientStatus.PROSPECT)
    default_sla_days: Optional[int] = Field(None, ge=1, le=365)


class ClientCreate(ClientBase):
    """Schema for creating a client."""
    account_manager_id: Optional[int] = None
    contacts: Optional[List[ClientContactCreate]] = Field(default_factory=list)


class ClientUpdate(BaseModel):
    """Schema for updating client."""
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    status: Optional[ClientStatus] = None
    account_manager_id: Optional[int] = None
    default_sla_days: Optional[int] = Field(None, ge=1, le=365)


class ClientResponse(ClientBase):
    """Schema for client response."""
    id: int
    account_manager_id: Optional[int]
    created_by: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    # Relationships
    contacts: List[ClientContactResponse] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


class ClientListResponse(BaseModel):
    """Schema for paginated client list."""
    clients: List[ClientResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ClientDetailResponse(ClientResponse):
    """Schema for detailed client response with statistics."""
    total_pitches: int = 0
    total_jds: int = 0
    active_jds: int = 0
    total_applications: int = 0
    
    model_config = ConfigDict(from_attributes=True)
