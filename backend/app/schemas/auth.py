"""
Authentication schemas for login, token, etc.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.core.permissions import UserRole


# Login Schema
class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str = Field(..., min_length=1)


# Token Response Schema
class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Token Refresh Schema
class TokenRefresh(BaseModel):
    """Schema for refreshing access token."""
    refresh_token: str


# Current User Response
class CurrentUserResponse(BaseModel):
    """Schema for current user information."""
    id: int
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True
