"""
User schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime

from app.core.permissions import UserRole


# Base User Schema
class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = Field(default=UserRole.RECRUITER)


# User Create Schema
class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=100)


# User Update Schema
class UserUpdate(BaseModel):
    """Schema for updating user information."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# User Response Schema
class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# User List Response
class UserListResponse(BaseModel):
    """Schema for paginated user list."""
    users: list[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


# Password Change Schema
class PasswordChange(BaseModel):
    """Schema for changing password."""
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8, max_length=100)


# Password Reset Request Schema
class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    email: EmailStr


# Password Reset Schema
class PasswordReset(BaseModel):
    """Schema for resetting password with token."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
