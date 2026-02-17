"""
Email Service - Gmail SMTP
Create as: backend/app/services/email_service.py
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)

# Setup Jinja2 template environment
TEMPLATES_DIR = Path(__file__).parent.parent / "email_templates"
TEMPLATES_DIR.mkdir(exist_ok=True)

jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)


class EmailService:
    """Gmail SMTP email service."""

    def __init__(self):
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.username = settings.EMAIL_USERNAME
        self.password = settings.EMAIL_PASSWORD  # Gmail App Password
        self.from_email = settings.EMAIL_FROM
        self.from_name = settings.EMAIL_FROM_NAME

    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        cc_emails: Optional[List[str]] = None,
    ) -> bool:
        """Send an email via Gmail SMTP."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = ", ".join(to_emails)
            if cc_emails:
                msg["Cc"] = ", ".join(cc_emails)

            # Attach HTML content
            html_part = MIMEText(html_content, "html")
            msg.attach(html_part)

            # All recipients
            all_recipients = to_emails + (cc_emails or [])

            # Send via Gmail SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(self.username, self.password)
                server.sendmail(self.from_email, all_recipients, msg.as_string())

            logger.info(f"Email sent successfully to {to_emails} | Subject: {subject}")
            return True

        except smtplib.SMTPAuthenticationError:
            logger.error("Gmail SMTP authentication failed. Check EMAIL_USERNAME and EMAIL_PASSWORD (App Password).")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error sending email: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email: {e}")
            return False

    def render_template(self, template_name: str, context: dict) -> str:
        """Render an HTML email template with context."""
        try:
            template = jinja_env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {e}")
            raise

    # =========================================================================
    # PRIORITY 1: INTERVIEW REMINDER
    # =========================================================================

    def send_interview_reminder_candidate(
        self,
        candidate_email: str,
        candidate_name: str,
        interview_date: str,
        interview_time: str,
        round_name: str,
        interview_mode: str,
        meeting_link: Optional[str],
        company_name: str,
        position_title: str,
        interviewer_name: Optional[str],
    ) -> bool:
        """Send interview reminder to candidate."""
        html = self.render_template("interview_reminder_candidate.html", {
            "candidate_name": candidate_name,
            "interview_date": interview_date,
            "interview_time": interview_time,
            "round_name": round_name,
            "interview_mode": interview_mode,
            "meeting_link": meeting_link,
            "company_name": company_name,
            "position_title": position_title,
            "interviewer_name": interviewer_name,
            "from_name": self.from_name,
        })
        return self.send_email(
            to_emails=[candidate_email],
            subject=f"Interview Reminder: {round_name} for {position_title} at {company_name}",
            html_content=html,
        )

    def send_interview_reminder_interviewer(
        self,
        interviewer_email: str,
        interviewer_name: str,
        candidate_name: str,
        interview_date: str,
        interview_time: str,
        round_name: str,
        interview_mode: str,
        meeting_link: Optional[str],
        position_title: str,
        resume_link: Optional[str],
    ) -> bool:
        """Send interview reminder to interviewer."""
        html = self.render_template("interview_reminder_interviewer.html", {
            "interviewer_name": interviewer_name,
            "candidate_name": candidate_name,
            "interview_date": interview_date,
            "interview_time": interview_time,
            "round_name": round_name,
            "interview_mode": interview_mode,
            "meeting_link": meeting_link,
            "position_title": position_title,
            "resume_link": resume_link,
            "from_name": self.from_name,
        })
        return self.send_email(
            to_emails=[interviewer_email],
            subject=f"Interview Scheduled: {candidate_name} - {round_name} for {position_title}",
            html_content=html,
        )

    # =========================================================================
    # PRIORITY 1: OFFER SENT
    # =========================================================================

    def send_offer_notification(
        self,
        candidate_email: str,
        candidate_name: str,
        position_title: str,
        company_name: str,
        annual_ctc: float,
        joining_date: Optional[str],
        offer_valid_till: Optional[str],
        recruiter_name: str,
        recruiter_email: str,
    ) -> bool:
        """Send offer letter notification to candidate."""
        html = self.render_template("offer_notification.html", {
            "candidate_name": candidate_name,
            "position_title": position_title,
            "company_name": company_name,
            "annual_ctc": f"{annual_ctc:,.0f}",
            "joining_date": joining_date,
            "offer_valid_till": offer_valid_till,
            "recruiter_name": recruiter_name,
            "recruiter_email": recruiter_email,
            "from_name": self.from_name,
        })
        return self.send_email(
            to_emails=[candidate_email],
            cc_emails=[recruiter_email],
            subject=f"Congratulations! Job Offer - {position_title} at {company_name}",
            html_content=html,
        )

    # =========================================================================
    # PRIORITY 1: SLA BREACH ALERT
    # =========================================================================

    def send_sla_breach_alert(
        self,
        recruiter_email: str,
        recruiter_name: str,
        breached_applications: List[dict],
    ) -> bool:
        """Send SLA breach alert to recruiter."""
        html = self.render_template("sla_breach_alert.html", {
            "recruiter_name": recruiter_name,
            "breached_applications": breached_applications,
            "total_breached": len(breached_applications),
            "from_name": self.from_name,
        })
        return self.send_email(
            to_emails=[recruiter_email],
            subject=f"⚠️ SLA Breach Alert - {len(breached_applications)} Applications Need Attention",
            html_content=html,
        )


# Global instance
email_service = EmailService()
