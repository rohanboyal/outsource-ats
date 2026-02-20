# backend/app/api/v1/endpoints/profile.py
"""
User Profile Management
Allows users to view and update their own profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.core.security import get_password_hash, verify_password
from app.api.deps import get_current_user

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    is_active: bool
    created_at: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/profile", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current user's profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat()
    }


@router.patch("/profile", response_model=ProfileResponse)
async def update_my_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's profile."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    
    if data.phone is not None:
        current_user.phone = data.phone
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat()
    }


@router.post("/profile/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change current user's password."""
    # Verify current password
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    if data.new_password == data.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }
