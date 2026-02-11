"""
Authentication schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from app.core.permissions import UserRole


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserRegister(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: UserRole = Field(default=UserRole.RECRUITER)


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    email: str
    full_name: str
    role: UserRole
    is_admin: bool
    is_active: bool
    
    class Config:
        from_attributes = True


# ============================================================================
# TOKEN SCHEMAS
# ============================================================================

class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str