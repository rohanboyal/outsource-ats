"""
Email Notification Triggers - FIXED
Replace: backend/app/services/notification_service.py
"""
import logging
from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Session

from app.services.email_service import email_service
from app.models.interview import Interview
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job_description import JobDescription
from app.models.client import Client
from app.models.offer import Offer
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)


def _is_email_enabled() -> bool:
    return getattr(settings, 'EMAIL_ENABLED', True)


def _safe_enum_value(val) -> str:
    """Safely extract string value from enum or string."""
    if val is None:
        return "N/A"
    if hasattr(val, 'value'):
        return str(val.value)
    return str(val)


def _safe_date_format(val, fmt: str = "%A, %B %d, %Y") -> Optional[str]:
    """Safely format a date/datetime value."""
    if val is None:
        return None
    try:
        if isinstance(val, str):
            val = datetime.fromisoformat(val)
        if hasattr(val, 'strftime'):
            return val.strftime(fmt)
    except Exception:
        return str(val)
    return str(val)


# ============================================================================
# INTERVIEW NOTIFICATIONS
# ============================================================================

def notify_interview_scheduled(interview_id: int, db: Session) -> bool:
    """
    Send interview reminders to both candidate and interviewer.
    """
    if not _is_email_enabled():
        logger.info("Email disabled - skipping interview notification")
        return True

    try:
        # Fetch interview
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            logger.error(f"Interview {interview_id} not found")
            return False

        if not interview.scheduled_date:
            logger.warning(f"Interview {interview_id} has no scheduled_date - skipping")
            return False

        # Fetch application
        application = db.query(Application).filter(
            Application.id == interview.application_id
        ).first()
        if not application:
            logger.error(f"Application {interview.application_id} not found")
            return False

        # Fetch candidate
        candidate = db.query(Candidate).filter(
            Candidate.id == application.candidate_id
        ).first()
        if not candidate:
            logger.error(f"Candidate {application.candidate_id} not found")
            return False

        # Fetch JD (optional)
        jd = None
        if application.jd_id:
            jd = db.query(JobDescription).filter(
                JobDescription.id == application.jd_id
            ).first()

        # Fetch client (optional)
        client = None
        if jd and jd.client_id:
            client = db.query(Client).filter(Client.id == jd.client_id).first()

        # ✅ Format date and time safely
        interview_date = _safe_date_format(interview.scheduled_date, "%A, %B %d, %Y") or "TBD"
        interview_time = _safe_date_format(interview.scheduled_date, "%I:%M %p") or "TBD"

        # ✅ Safely get interview mode
        interview_mode = _safe_enum_value(interview.interview_mode)

        position_title = jd.title if jd else "Open Position"
        company_name = client.company_name if client else "Our Client"
        candidate_name = f"{candidate.first_name} {candidate.last_name}"

        # Send to candidate
        if candidate.email:
            success = email_service.send_interview_reminder_candidate(
                candidate_email=candidate.email,
                candidate_name=candidate_name,
                interview_date=interview_date,
                interview_time=interview_time,
                round_name=interview.round_name or "Interview",
                interview_mode=interview_mode,
                meeting_link=interview.meeting_link,
                company_name=company_name,
                position_title=position_title,
                interviewer_name=interview.interviewer_name,
            )
            if success:
                logger.info(f"✅ Interview reminder sent to candidate: {candidate.email}")
            else:
                logger.error(f"❌ Failed to send to candidate: {candidate.email}")
        else:
            logger.warning(f"Candidate {candidate.id} has no email - skipping candidate notification")

        # Send to interviewer
        if interview.interviewer_email:
            success = email_service.send_interview_reminder_interviewer(
                interviewer_email=interview.interviewer_email,
                interviewer_name=interview.interviewer_name or "Interviewer",
                candidate_name=candidate_name,
                interview_date=interview_date,
                interview_time=interview_time,
                round_name=interview.round_name or "Interview",
                interview_mode=interview_mode,
                meeting_link=interview.meeting_link,
                position_title=position_title,
                resume_link=getattr(candidate, 'resume_path', None),
            )
            if success:
                logger.info(f"✅ Interview reminder sent to interviewer: {interview.interviewer_email}")
            else:
                logger.error(f"❌ Failed to send to interviewer: {interview.interviewer_email}")
        else:
            logger.info(f"Interview {interview_id} has no interviewer_email - skipping interviewer notification")

        return True

    except Exception as e:
        logger.error(f"❌ notify_interview_scheduled error: {e}", exc_info=True)
        return False


# ============================================================================
# OFFER NOTIFICATIONS
# ============================================================================

def notify_offer_sent(offer_id: int, db: Session) -> bool:
    """
    Send offer notification to candidate.
    """
    if not _is_email_enabled():
        logger.info("Email disabled - skipping offer notification")
        return True

    try:
        # Fetch offer
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            logger.error(f"Offer {offer_id} not found")
            return False

        # Fetch application
        application = db.query(Application).filter(
            Application.id == offer.application_id
        ).first()
        if not application:
            logger.error(f"Application {offer.application_id} not found")
            return False

        # Fetch candidate
        candidate = db.query(Candidate).filter(
            Candidate.id == application.candidate_id
        ).first()
        if not candidate or not candidate.email:
            logger.error(f"Candidate not found or has no email for offer {offer_id}")
            return False

        # Fetch JD (optional)
        jd = None
        if application.jd_id:
            jd = db.query(JobDescription).filter(
                JobDescription.id == application.jd_id
            ).first()

        # Fetch client (optional)
        client = None
        if jd and jd.client_id:
            client = db.query(Client).filter(Client.id == jd.client_id).first()

        # Fetch recruiter (optional)
        recruiter = None
        if offer.created_by:
            recruiter = db.query(User).filter(User.id == offer.created_by).first()

        # ✅ Format dates safely
        joining_date = _safe_date_format(
            getattr(offer, 'joining_date', None), "%B %d, %Y"
        )
        offer_valid_till = _safe_date_format(
            getattr(offer, 'offer_valid_till', None), "%B %d, %Y"
        )

        # ✅ Get CTC safely - check both field names
        annual_ctc = getattr(offer, 'annual_ctc', None) or getattr(offer, 'ctc_annual', None) or 0

        success = email_service.send_offer_notification(
            candidate_email=candidate.email,
            candidate_name=f"{candidate.first_name} {candidate.last_name}",
            position_title=jd.title if jd else "Open Position",
            company_name=client.company_name if client else "Our Client",
            annual_ctc=float(annual_ctc),
            joining_date=joining_date,
            offer_valid_till=offer_valid_till,
            recruiter_name=recruiter.full_name if recruiter else "Recruiter",
            recruiter_email=recruiter.email if recruiter else settings.EMAIL_FROM,
        )

        if success:
            logger.info(f"✅ Offer notification sent to: {candidate.email}")
        else:
            logger.error(f"❌ Failed to send offer notification to: {candidate.email}")

        return success

    except Exception as e:
        logger.error(f"❌ notify_offer_sent error: {e}", exc_info=True)
        return False


# ============================================================================
# SLA BREACH ALERTS
# ============================================================================

def notify_sla_breaches(db: Session) -> bool:
    """
    Send SLA breach alerts to recruiters.
    """
    if not _is_email_enabled():
        return True

    try:
        from app.models.application import ApplicationStatus
        from collections import defaultdict

        # Get all SLA-breached active applications
        breached = db.query(Application).filter(
            Application.sla_status == 'breached',
            Application.status.notin_([
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN,
                ApplicationStatus.JOINED
            ])
        ).all()

        if not breached:
            logger.info("No SLA breaches found - no alerts sent")
            return True

        logger.info(f"Found {len(breached)} SLA-breached applications")

        recruiter_apps = defaultdict(list)

        for app in breached:
            jd = db.query(JobDescription).filter(
                JobDescription.id == app.jd_id
            ).first() if app.jd_id else None

            candidate = db.query(Candidate).filter(
                Candidate.id == app.candidate_id
            ).first()

            client = db.query(Client).filter(
                Client.id == jd.client_id
            ).first() if jd and jd.client_id else None

            # Calculate days overdue safely
            days_overdue = 0
            if app.sla_end_date:
                try:
                    sla_date = app.sla_end_date
                    if isinstance(sla_date, datetime):
                        sla_date = sla_date.date()
                    days_overdue = max(0, (date.today() - sla_date).days)
                except Exception:
                    days_overdue = 0

            # Format SLA deadline
            sla_deadline = _safe_date_format(app.sla_end_date, "%b %d, %Y") or "N/A"

            app_data = {
                "candidate_name": f"{candidate.first_name} {candidate.last_name}" if candidate else f"Candidate #{app.candidate_id}",
                "position_title": jd.title if jd else "N/A",
                "client_name": client.company_name if client else "N/A",
                "sla_deadline": sla_deadline,
                "days_overdue": days_overdue,
            }

            recruiter_id = jd.assigned_recruiter_id if jd and jd.assigned_recruiter_id else None
            recruiter_apps[recruiter_id].append(app_data)

        # Send alerts per recruiter
        for recruiter_id, apps in recruiter_apps.items():
            if recruiter_id:
                recruiter = db.query(User).filter(User.id == recruiter_id).first()
                if recruiter and recruiter.email:
                    email_service.send_sla_breach_alert(
                        recruiter_email=recruiter.email,
                        recruiter_name=recruiter.full_name,
                        breached_applications=apps
                    )
                    logger.info(f"✅ SLA alert sent to {recruiter.email} for {len(apps)} apps")
            else:
                # Fallback to admin
                admin_email = getattr(settings, 'EMAIL_FROM', None)
                if admin_email:
                    email_service.send_sla_breach_alert(
                        recruiter_email=admin_email,
                        recruiter_name="Admin",
                        breached_applications=apps
                    )

        return True

    except Exception as e:
        logger.error(f"❌ notify_sla_breaches error: {e}", exc_info=True)
        return False