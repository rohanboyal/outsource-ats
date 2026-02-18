"""
Admin: Create Client Portal Users
Add these endpoints to: backend/app/api/v1/endpoints/clients.py
(or create a new file: backend/app/api/v1/endpoints/client_users.py)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.client import Client, ClientContact
from app.core.security import get_password_hash
from app.api.deps import get_current_user
from app.core.permissions import Permission
from app.api.deps import PermissionChecker
from app.services.email_service import email_service

router = APIRouter()


class CreateClientUserRequest(BaseModel):
    client_id: int
    email: str
    full_name: str
    password: str
    send_welcome_email: bool = True


class ClientUserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    client_id: int
    client_name: str
    is_active: bool


@router.post("/client-users", response_model=ClientUserResponse)
async def create_client_portal_user(
    data: CreateClientUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """
    Admin creates a portal login for a client contact.
    The client's email must match an existing ClientContact record.
    """
    # Verify client exists
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Check email not already registered
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create or verify ClientContact exists with this email
    contact = db.query(ClientContact).filter(
        ClientContact.client_id == data.client_id,
        ClientContact.email == data.email
    ).first()

    if not contact:
        # Auto-create a client contact record
        contact = ClientContact(
            client_id=data.client_id,
            name=data.full_name,
            email=data.email,
            is_primary=False
        )
        db.add(contact)

    # Create user with CLIENT role
    new_user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=UserRole.CLIENT,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send welcome email
    if data.send_welcome_email:
        try:
            _send_client_welcome_email(
                to_email=data.email,
                client_name=data.full_name,
                company_name=client.company_name,
                login_email=data.email,
                temp_password=data.password,
            )
        except Exception:
            pass  # Don't fail if email fails

    return ClientUserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        client_id=client.id,
        client_name=client.company_name,
        is_active=new_user.is_active,
    )


@router.get("/client-users")
async def list_client_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """List all client portal users."""
    users = db.query(User).filter(User.role == UserRole.CLIENT).all()
    result = []
    for user in users:
        contact = db.query(ClientContact).filter(
            ClientContact.email == user.email
        ).first()
        client = db.query(Client).filter(
            Client.id == contact.client_id
        ).first() if contact else None

        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "client_id": client.id if client else None,
            "client_name": client.company_name if client else "Unknown",
            "created_at": user.created_at,
        })
    return result


@router.patch("/client-users/{user_id}/toggle")
async def toggle_client_user_access(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.MANAGE_USERS))
):
    """Enable or disable a client portal user."""
    user = db.query(User).filter(
        User.id == user_id,
        User.role == UserRole.CLIENT
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Client user not found")

    user.is_active = not user.is_active
    db.commit()

    return {
        "success": True,
        "is_active": user.is_active,
        "message": f"User {'enabled' if user.is_active else 'disabled'} successfully"
    }


def _send_client_welcome_email(
    to_email: str,
    client_name: str,
    company_name: str,
    login_email: str,
    temp_password: str,
):
    """Send welcome email to new client portal user."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f4f6f9; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%); padding: 32px 40px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: white;">Outsource<span style="color: #64b5f6;">ATS</span></div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px;">Client Portal Access</div>
        </div>
        <div style="padding: 40px;">
          <p style="font-size: 20px; font-weight: 600; color: #1e3a5f;">Welcome, {client_name}! 👋</p>
          <p style="color: #444; line-height: 1.7;">
            Your client portal access for <strong>{company_name}</strong> has been set up.
            You can now log in to track your recruitment pipeline, review candidates, and provide feedback.
          </p>
          <div style="background: #f8faff; border: 1px solid #dce8f5; border-radius: 10px; padding: 24px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef2f8;">
              <span style="color: #6b7a99; font-size: 13px;">Portal URL</span>
              <span style="color: #1e3a5f; font-weight: 600; font-size: 14px;">ats.khuriwalgroup.com/client/login</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eef2f8;">
              <span style="color: #6b7a99; font-size: 13px;">Email</span>
              <span style="color: #1e3a5f; font-weight: 600; font-size: 14px;">{login_email}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span style="color: #6b7a99; font-size: 13px;">Password</span>
              <span style="color: #1e3a5f; font-weight: 600; font-size: 14px;">{temp_password}</span>
            </div>
          </div>
          <div style="background: #fff8e1; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <div style="font-weight: 700; color: #92400e; margin-bottom: 4px;">🔒 Security Notice</div>
            <div style="color: #78350f; font-size: 13px;">Please change your password after your first login.</div>
          </div>
          <p style="color: #444; line-height: 1.7;">If you have any issues accessing the portal, please contact your recruitment team.</p>
          <p style="margin-top: 24px; color: #444;">Best regards,<br/><strong>OutsourceATS Team</strong></p>
        </div>
      </div>
    </body>
    </html>
    """
    email_service.send_email(
        to_emails=[to_email],
        subject=f"Welcome to OutsourceATS Client Portal - {company_name}",
        html_content=html,
    )
