"""
Setup endpoint for creating first admin user via Swagger.
Location: backend/app/api/v1/endpoints/setup.py
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.models.user import User, UserRole
from app.core.security import get_password_hash

router = APIRouter()


class FirstAdminRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class SetupStatusResponse(BaseModel):
    is_setup_complete: bool
    user_count: int
    message: str


@router.get("/setup/status", response_model=SetupStatusResponse)
async def check_setup_status(db: Session = Depends(get_db)):
    """
    Check if system setup is complete.
    Returns True if any users exist in the system.
    """
    user_count = db.query(User).count()
    
    return {
        "is_setup_complete": user_count > 0,
        "user_count": user_count,
        "message": "System is ready" if user_count > 0 else "No users found. Create first admin via /setup/first-admin"
    }


@router.post("/setup/first-admin")
async def create_first_admin(
    data: FirstAdminRequest,
    db: Session = Depends(get_db)
):
    """
    Create the first admin user.
    
    ⚠️ IMPORTANT: This endpoint can ONLY be called when NO users exist.
    After the first admin is created, this endpoint will return 403 Forbidden.
    
    Usage via Swagger:
    1. Go to /docs
    2. Find POST /api/v1/setup/first-admin
    3. Click "Try it out"
    4. Enter admin details
    5. Execute
    
    Example:
    {
        "email": "admin@khuriwalgroup.com",
        "full_name": "Rohan Khuriwal",
        "password": "SecurePassword123!"
    }
    """
    # Check if any users exist
    user_count = db.query(User).count()
    if user_count > 0:
        raise HTTPException(
            status_code=403,
            detail=f"Setup already complete. System has {user_count} user(s). Use admin panel to add more users."
        )
    
    # Check if email already exists (shouldn't happen, but safety check)
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create first admin user
    admin = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=UserRole.ADMIN,
        is_admin=True,
        is_active=True
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    return {
        "success": True,
        "message": "✅ First admin created successfully! You can now login at /login",
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name,
            "role": admin.role.value if hasattr(admin.role, 'value') else str(admin.role)
        },
        "next_steps": [
            "1. Login with your credentials",
            "2. Go to Settings → Team Members",
            "3. Add more team members as needed"
        ]
    }
