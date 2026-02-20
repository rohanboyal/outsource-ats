"""
Team Users Management - FIXED (Removed is_admin setter)
Location: backend/app/api/v1/endpoints/team_users.py

⚠️ FIX: Removed is_admin property setting since it's computed from role
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import secrets
import string

from app.db.session import get_db
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.api.deps import get_current_user, PermissionChecker
from app.core.permissions import Permission
from app.services.email_service import email_service

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateTeamUserRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    send_welcome_email: bool = True


class UpdateTeamUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class TeamUserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str


class TeamStatsResponse(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    by_role: dict


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_password(length: int = 12) -> str:
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    # Ensure at least one of each type
    password = secrets.choice(string.ascii_uppercase) + \
               secrets.choice(string.ascii_lowercase) + \
               secrets.choice(string.digits) + \
               secrets.choice("!@#$%^&*") + \
               password[4:]
    return password


def send_welcome_email(email: str, full_name: str, role: str, temp_password: str):
    """Send welcome email to new team member."""
    role_display = role.replace('_', ' ').title()
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f4f6f9; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%); padding: 32px 40px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: white;">KGF <span style="color: #64b5f6;">HireX</span></div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px;">Welcome to the Team!</div>
        </div>
        <div style="padding: 40px;">
          <p style="font-size: 20px; font-weight: 600; color: #1e3a5f;">Welcome, {full_name}! 👋</p>
          <p style="color: #444; line-height: 1.7;">
            Your account has been created on KGF HireX. You can now log in to start managing recruitment processes.
          </p>
          <div style="background: #f8faff; border: 1px solid #dce8f5; border-radius: 10px; padding: 24px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef2f8;">
              <span style="color: #6b7a99; font-size: 13px;">Portal URL</span>
              <span style="color: #1e3a5f; font-weight: 600; font-size: 14px;">ats.khuriwalgroup.com/login</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef2f8;">
              <span style="color: #6b7a99; font-size: 13px;">Email</span>
              <span style="color: #1e3a5f; font-weight: 600; font-size: 14px;">{email}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef2f8;">
              <span style="color: #6b7a99; font-size: 13px;">Your Role</span>
              <span style="color: #1e3a5f; font-weight: 600; font-size: 14px;">{role_display}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span style="color: #6b7a99; font-size: 13px;">Temporary Password</span>
              <span style="color: #1e3a5f; font-weight: 600; font-size: 14px; font-family: monospace;">{temp_password}</span>
            </div>
          </div>
          <div style="background: #fff8e1; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <div style="font-weight: 700; color: #92400e; margin-bottom: 4px; font-size: 14px;">🔒 Security Notice</div>
            <div style="color: #78350f; font-size: 13px;">Please change your password immediately after your first login for security.</div>
          </div>
          <p style="color: #444; line-height: 1.7;">If you have any questions or need assistance, please contact your administrator.</p>
          <p style="margin-top: 24px; color: #444;">Best regards,<br/><strong>KGF HireX Team</strong></p>
        </div>
        <div style="background: #f8faff; padding: 20px; text-align: center; border-top: 1px solid #eef2f8;">
          <p style="font-size: 11px; color: #9aa3b8; margin: 0;">
            © 2026 KGF HireX. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    """
    
    email_service.send_email(
        to_emails=[email],
        subject=f"Welcome to KGF HireX Team - Your {role_display} Account",
        html_content=html,
    )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/team/stats", response_model=TeamStatsResponse)
async def get_team_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """Get team statistics (admin only). Excludes client users."""
    users = db.query(User).filter(User.role != UserRole.CLIENT).all()
    
    total = len(users)
    active = len([u for u in users if u.is_active])
    inactive = total - active
    
    by_role = {}
    for user in users:
        role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        by_role[role] = by_role.get(role, 0) + 1
    
    return {
        "total_users": total,
        "active_users": active,
        "inactive_users": inactive,
        "by_role": by_role
    }


@router.get("/team/users", response_model=List[TeamUserResponse])
async def list_team_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """List all team users (excludes clients). Admin only."""
    users = db.query(User).filter(User.role != UserRole.CLIENT).order_by(User.created_at.desc()).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat()
        }
        for user in users
    ]


@router.post("/team/users", response_model=TeamUserResponse, status_code=status.HTTP_201_CREATED)
async def create_team_user(
    data: CreateTeamUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """Create a new team user (admin only)."""
    # Validate role
    valid_roles = ['recruiter', 'account_manager', 'bd_sales', 'finance', 'admin']
    if data.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered in the system"
        )
    
    # Generate secure temporary password
    temp_password = generate_password()
    
    # ✅ FIX: Create user WITHOUT is_admin (it's computed from role)
    new_user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(temp_password),
        role=UserRole(data.role),
        # ❌ REMOVED: is_admin=(data.role == 'admin')  # This was causing the error!
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send welcome email
    if data.send_welcome_email:
        try:
            send_welcome_email(
                email=data.email,
                full_name=data.full_name,
                role=data.role,
                temp_password=temp_password
            )
        except Exception as e:
            print(f"⚠️ Failed to send welcome email: {e}")
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role),
        "is_active": new_user.is_active,
        "created_at": new_user.created_at.isoformat()
    }


@router.get("/team/users/{user_id}", response_model=TeamUserResponse)
async def get_team_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """Get single team user details (admin only)."""
    user = db.query(User).filter(User.id == user_id, User.role != UserRole.CLIENT).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat()
    }


@router.patch("/team/users/{user_id}", response_model=TeamUserResponse)
async def update_team_user(
    user_id: int,
    data: UpdateTeamUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """Update team user details (admin only)."""
    user = db.query(User).filter(User.id == user_id, User.role != UserRole.CLIENT).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if data.full_name is not None:
        user.full_name = data.full_name
    
    if data.email is not None and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email
    
    if data.role is not None:
        valid_roles = ['recruiter', 'account_manager', 'bd_sales', 'finance', 'admin']
        if data.role not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        user.role = UserRole(data.role)
        # ❌ REMOVED: user.is_admin = (data.role == 'admin')  # This was also causing issues!
    
    if data.is_active is not None:
        if user.id == current_user.id and not data.is_active:
            raise HTTPException(
                status_code=400,
                detail="You cannot deactivate your own account"
            )
        user.is_active = data.is_active
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat()
    }


@router.patch("/team/users/{user_id}/toggle")
async def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """Enable/disable a team user (admin only)."""
    user = db.query(User).filter(User.id == user_id, User.role != UserRole.CLIENT).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot disable your own account"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "success": True,
        "is_active": user.is_active,
        "message": f"User {'enabled' if user.is_active else 'disabled'} successfully"
    }


@router.post("/team/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """Reset user password and send new credentials via email (admin only)."""
    user = db.query(User).filter(User.id == user_id, User.role != UserRole.CLIENT).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_password = generate_password()
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # Send email with new password
    try:
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f6f9; padding: 40px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%); padding: 32px 40px; text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: white;">KGF <span style="color: #64b5f6;">HireX</span></div>
              <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px;">Password Reset</div>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 20px; font-weight: 600; color: #1e3a5f;">Password Reset Notification</p>
              <p style="color: #444; line-height: 1.7;">Hi {user.full_name},</p>
              <p style="color: #444; line-height: 1.7;">Your password has been reset by an administrator. Here are your new login credentials:</p>
              <div style="background: #f8faff; border: 1px solid #dce8f5; border-radius: 10px; padding: 24px; margin: 24px 0;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef2f8;">
                  <span style="color: #6b7a99; font-size: 13px;">Login URL</span>
                  <span style="color: #1e3a5f; font-weight: 600; font-size: 14px;">ats.khuriwalgroup.com/login</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef2f8;">
                  <span style="color: #6b7a99; font-size: 13px;">Email</span>
                  <span style="color: #1e3a5f; font-weight: 600; font-size: 14px;">{user.email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                  <span style="color: #6b7a99; font-size: 13px;">New Password</span>
                  <span style="color: #1e3a5f; font-weight: 600; font-size: 14px; font-family: monospace;">{new_password}</span>
                </div>
              </div>
              <div style="background: #fff8e1; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                <div style="font-weight: 700; color: #92400e; margin-bottom: 4px; font-size: 14px;">🔒 Security Reminder</div>
                <div style="color: #78350f; font-size: 13px;">Please change your password immediately after logging in.</div>
              </div>
              <p style="color: #444; line-height: 1.7;">If you did not request this password reset, please contact your administrator immediately.</p>
              <p style="margin-top: 24px; color: #444;">Best regards,<br/><strong>KGF HireX Team</strong></p>
            </div>
          </div>
        </body>
        </html>
        """
        
        email_service.send_email(
            to_emails=[user.email],
            subject="Password Reset - KGF HireX",
            html_content=html
        )
    except Exception as e:
        print(f"⚠️ Failed to send password reset email: {e}")
    
    return {
        "success": True,
        "message": "Password reset successfully. New password has been sent to the user's email."
    }


@router.delete("/team/users/{user_id}")
async def delete_team_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """Delete a team user permanently (admin only)."""
    user = db.query(User).filter(User.id == user_id, User.role != UserRole.CLIENT).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account"
        )
    
    user_email = user.email
    user_name = user.full_name
    
    db.delete(user)
    db.commit()
    
    return {
        "success": True,
        "message": f"User {user_name} ({user_email}) deleted successfully"
    }