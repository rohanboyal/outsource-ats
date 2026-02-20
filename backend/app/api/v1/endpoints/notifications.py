"""
Email Notifications API Endpoint
Create as: backend/app/api/v1/endpoints/notifications.py
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.services.email_service import email_service
from app.services.notification_service import (
    notify_interview_scheduled,
    notify_offer_sent,
    notify_sla_breaches,
)
from app.core.permissions import Permission
from app.api.deps import get_current_user, PermissionChecker

router = APIRouter()


class TestEmailRequest(BaseModel):
    to_email: str
    message: Optional[str] = "This is a test email from KGF HireX."


# ============================================================================
# TEST EMAIL
# ============================================================================

@router.post("/test-email")
async def send_test_email(
    request: TestEmailRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a test email to verify Gmail SMTP configuration."""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 40px; background: #f4f6f9;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px;">
        <h2 style="color: #1e3a5f;">✅ Test Email Successful!</h2>
        <p style="color: #444; line-height: 1.6;">
          Your Gmail SMTP configuration is working correctly.
        </p>
        <p style="color: #444; line-height: 1.6;">
          <strong>Message:</strong> {request.message}
        </p>
        <p style="color: #444; line-height: 1.6;">
          <strong>Sent by:</strong> {current_user.full_name}
        </p>
        <hr style="border: 1px solid #eef2f8; margin: 24px 0;">
        <p style="color: #9aa3b8; font-size: 13px;">
          KGF HireX - Recruitment Management System
        </p>
      </div>
    </body>
    </html>
    """

    success = email_service.send_email(
        to_emails=[request.to_email],
        subject="✅ KGF HireX - Email Configuration Test",
        html_content=html_content,
    )

    if success:
        return {"success": True, "message": f"Test email sent successfully to {request.to_email}"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test email. Check EMAIL_USERNAME and EMAIL_PASSWORD in .env"
        )


# ============================================================================
# MANUAL TRIGGERS
# ============================================================================

@router.post("/interviews/{interview_id}/notify")
async def notify_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger interview notification emails."""
    success = notify_interview_scheduled(interview_id, db)
    if success:
        return {"success": True, "message": "Interview notifications sent successfully"}
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to send interview notifications"
    )


@router.post("/offers/{offer_id}/notify")
async def notify_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger offer notification email."""
    success = notify_offer_sent(offer_id, db)
    if success:
        return {"success": True, "message": "Offer notification sent successfully"}
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to send offer notification"
    )


@router.post("/sla-alerts/send")
async def trigger_sla_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """Manually trigger SLA breach alerts to all recruiters."""
    success = notify_sla_breaches(db)
    if success:
        return {"success": True, "message": "SLA breach alerts sent to recruiters"}
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to send SLA alerts"
    )
