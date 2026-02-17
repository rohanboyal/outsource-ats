from __future__ import annotations

import os
from datetime import datetime, date, timedelta
from typing import Optional

from sqlalchemy.orm import Session

# Adjust if your SessionLocal path differs
from app.db.session import SessionLocal

# Models (adjust import paths if your repo uses different module names)
from app.models.user import User
from app.models.client import Client, ClientContact
from app.models.candidate import Candidate
from app.models.pitch import Pitch
from app.models.job_description import JobDescription
from app.models.application import Application, ApplicationStatusHistory
from app.models.interview import Interview
from app.models.offer import Offer
from app.models.joining import Joining


# ----------------------------
# Helpers
# ----------------------------

def _hash_password(password: str) -> str:
    """
    Uses your project's hashing util if available; otherwise uses passlib(bcrypt).
    """
    try:
        from app.core.security import get_password_hash  # type: ignore
        return get_password_hash(password)
    except Exception:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)


def _now() -> datetime:
    return datetime.utcnow()


def _get_or_create_user(db: Session, email: str, full_name: str, role: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        # keep it updated if you want
        user.full_name = full_name
        user.role = role
        user.is_active = True
        user.is_verified = True
        return user

    user = User(
        email=email,
        hashed_password=_hash_password(password),
        full_name=full_name,
        role=role,  # CAPS roles as per your DB enum
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()
    return user


def _get_or_create_client(db: Session, company_name: str, created_by: int, account_manager_id: Optional[int] = None) -> Client:
    client = db.query(Client).filter(Client.company_name == company_name).first()
    if client:
        return client

    client = Client(
        company_name=company_name,
        industry="IT Services",
        website="https://example.com",
        address="Demo Address",
        status="ACTIVE",  # CAPS enum if you migrated to caps in DB
        default_sla_days=7,
        created_by=created_by,
        account_manager_id=account_manager_id,
    )
    db.add(client)
    db.flush()
    return client


def _get_or_create_client_contact(db: Session, client_id: int, email: str) -> ClientContact:
    cc = db.query(ClientContact).filter(ClientContact.client_id == client_id, ClientContact.email == email).first()
    if cc:
        return cc

    cc = ClientContact(
        client_id=client_id,
        name="Client HR",
        email=email,
        phone="9999999999",
        designation="HR Manager",
        is_primary=True,
    )
    db.add(cc)
    db.flush()
    return cc


def _get_or_create_candidate(db: Session, email: str, created_by: int) -> Candidate:
    c = db.query(Candidate).filter(Candidate.email == email).first()
    if c:
        return c

    c = Candidate(
        first_name="John",
        last_name="Doe",
        email=email,
        phone="8888888888",
        current_company="DemoCorp",
        current_designation="Software Engineer",
        total_experience=5.0,
        relevant_experience=4.0,
        skills=[{"name": "Python"}, {"name": "FastAPI"}, {"name": "SQL"}],
        certifications=[{"name": "AWS Practitioner"}],
        current_location="Bangalore",
        preferred_locations=["Bangalore", "Remote"],
        willing_to_relocate=0,
        notice_period_days=30,
        serving_notice_period=1,
        current_ctc=25.0,
        expected_ctc=35.0,
        currency="USD",
        source="DIRECT",  # CAPS enum
        source_details="Seed Data",
        linkedin_url="https://linkedin.com/in/johndoe",
        highest_education="B.Tech",
        education_details=[{"degree": "B.Tech", "year": 2019}],
        tags=["seed", "backend"],
        created_by=created_by,
    )
    db.add(c)
    db.flush()
    return c


def _get_or_create_pitch(db: Session, client_id: int, created_by: int) -> Pitch:
    title = "Demo Pitch - IT Hiring"
    p = db.query(Pitch).filter(Pitch.client_id == client_id, Pitch.pitch_title == title).first()
    if p:
        return p

    p = Pitch(
        client_id=client_id,
        pitch_title=title,
        description="Seed pitch for demo.",
        proposed_roles=[{"title": "Backend Engineer", "count": 2, "rate": 5000}],
        expected_headcount=2,
        rate_card={"currency": "USD", "billing_type": "monthly"},
        status="APPROVED",  # CAPS enum
        sent_date=date.today() - timedelta(days=7),
        decision_date=date.today() - timedelta(days=2),
        created_by=created_by,
    )
    db.add(p)
    db.flush()
    return p


def _get_or_create_jd(db: Session, client_id: int, pitch_id: int, created_by: int, assigned_recruiter_id: Optional[int]) -> JobDescription:
    jd_code = os.getenv("SEED_JD_CODE", "JD-DEMO-001")
    jd = db.query(JobDescription).filter(JobDescription.jd_code == jd_code).first()
    if jd:
        return jd

    jd = JobDescription(
        client_id=client_id,
        pitch_id=pitch_id,
        assigned_recruiter_id=assigned_recruiter_id,
        jd_code=jd_code,
        title="Backend Engineer (Python/FastAPI)",
        description="Seed JD for demo pipeline.",
        required_skills=["Python", "FastAPI", "SQL"],
        preferred_skills=["Docker", "Kubernetes"],
        experience_min=3.0,
        experience_max=8.0,
        location="Remote",
        work_mode="remote",
        contract_type="FULL_TIME",  # CAPS enum
        open_positions=1,
        filled_positions=0,
        status="OPEN",             # CAPS enum
        priority="HIGH",           # CAPS enum
        sla_days=7,
        version=1,
        currency="USD",
        created_by=created_by,
    )
    db.add(jd)
    db.flush()
    return jd


def _get_or_create_application(db: Session, candidate_id: int, jd_id: int, created_by: int) -> Application:
    app = (
        db.query(Application)
        .filter(Application.candidate_id == candidate_id, Application.jd_id == jd_id)
        .first()
    )
    if app:
        return app

    app = Application(
        candidate_id=candidate_id,
        jd_id=jd_id,
        status="SOURCED",  # CAPS enum
        substatus="Seeded",
        screening_notes="Auto-seeded application",
        internal_rating=4,
        sla_start_date=date.today(),
        sla_end_date=date.today() + timedelta(days=7),
        sla_status="ON_TRACK",  # CAPS enum
        notes="Seed pipeline record",
        created_by=created_by,
    )
    db.add(app)
    db.flush()
    return app


def _add_status_history(db: Session, application_id: int, changed_by: int, from_status: Optional[str], to_status: str, notes: str) -> None:
    exists = (
        db.query(ApplicationStatusHistory)
        .filter(
            ApplicationStatusHistory.application_id == application_id,
            ApplicationStatusHistory.to_status == to_status
        )
        .first()
    )
    if exists:
        return

    h = ApplicationStatusHistory(
        application_id=application_id,
        from_status=from_status,
        to_status=to_status,
        changed_by=changed_by,
        notes=notes,
    )
    db.add(h)
    db.flush()


def _get_or_create_interview(db: Session, application_id: int, created_by: int) -> Interview:
    # One interview per application + round_number 1
    i = (
        db.query(Interview)
        .filter(Interview.application_id == application_id, Interview.round_number == 1)
        .first()
    )
    if i:
        return i

    i = Interview(
        application_id=application_id,
        round_number=1,
        round_name="Technical Round 1",
        scheduled_date=_now() + timedelta(days=2),
        duration_minutes=60,
        interviewer_name="Tech Lead",
        interviewer_email="techlead@example.com",
        interviewer_designation="Lead Engineer",
        is_client_interview=True,
        interview_mode="VIDEO",     # CAPS enum
        status="SCHEDULED",         # CAPS enum
        result="PENDING",           # CAPS enum
        created_by=created_by,
    )
    db.add(i)
    db.flush()
    return i


def _get_or_create_offer(db: Session, application_id: int, created_by: int) -> Offer:
    offer_number = os.getenv("SEED_OFFER_NUMBER", "OFF-DEMO-001")
    o = db.query(Offer).filter(Offer.offer_number == offer_number).first()
    if o:
        return o

    o = Offer(
        application_id=application_id,
        offer_number=offer_number,
        designation="Backend Engineer",
        department="Engineering",
        ctc_annual=90000.0,
        fixed_component=80000.0,
        variable_component=10000.0,
        currency="USD",
        other_benefits={"insurance": "Health", "pto": "20 days"},
        joining_date_proposed=date.today() + timedelta(days=30),
        offer_valid_till=date.today() + timedelta(days=10),
        status="SENT",              # CAPS enum
        revision_number=1,
        requires_approval=0,
        notes="Seed offer",
        created_by=created_by,
        sent_date=_now(),
    )
    db.add(o)
    db.flush()
    return o


def _get_or_create_joining(db: Session, application_id: int, offer_id: int, created_by: int) -> Joining:
    j = db.query(Joining).filter(Joining.application_id == application_id).first()
    if j:
        return j

    j = Joining(
        application_id=application_id,
        offer_id=offer_id,
        expected_joining_date=date.today() + timedelta(days=30),
        employee_id="EMP-DEMO-001",
        work_email="john.doe@client.com",
        reporting_manager="Manager Name",
        status="CONFIRMED",  # CAPS enum
        bgv_status=os.getenv("SEED_BGV_STATUS", "PENDING"),  # your legacy column
        replacement_window_days=30,
        replacement_initiated=0,
        documents_collected=[{"name": "ID Proof", "submitted": True, "verified": False}],
        onboarding_status={"orientation": "pending", "system_access": "pending"},
        notes="Seed joining record",
        created_by=created_by,
    )
    db.add(j)
    db.flush()
    return j


# ----------------------------
# Seed runner
# ----------------------------

def run_seed() -> None:
    # You can override these via env vars
    admin_email = os.getenv("SEED_ADMIN_EMAIL", "admin@outsource-ats.com")
    admin_pass = os.getenv("SEED_ADMIN_PASSWORD", "Admin@12345")

    recruiter_email = os.getenv("SEED_RECRUITER_EMAIL", "recruiter@outsource-ats.com")
    recruiter_pass = os.getenv("SEED_RECRUITER_PASSWORD", "Recruiter@12345")

    account_mgr_email = os.getenv("SEED_ACCOUNT_MGR_EMAIL", "am@outsource-ats.com")
    account_mgr_pass = os.getenv("SEED_ACCOUNT_MGR_PASSWORD", "AM@12345")

    client_company = os.getenv("SEED_CLIENT_COMPANY", "Demo Client Pvt Ltd")
    client_contact_email = os.getenv("SEED_CLIENT_CONTACT_EMAIL", "hr@democlient.com")

    candidate_email = os.getenv("SEED_CANDIDATE_EMAIL", "john.doe.candidate@example.com")

    with SessionLocal() as db:
        try:
            # Users
            admin = _get_or_create_user(db, admin_email, "System Admin", "ADMIN", admin_pass)
            recruiter = _get_or_create_user(db, recruiter_email, "Recruiter One", "RECRUITER", recruiter_pass)
            am = _get_or_create_user(db, account_mgr_email, "Account Manager", "ACCOUNT_MANAGER", account_mgr_pass)

            # Client + contact
            client = _get_or_create_client(db, client_company, created_by=admin.id, account_manager_id=am.id)
            _get_or_create_client_contact(db, client.id, client_contact_email)

            # Candidate
            candidate = _get_or_create_candidate(db, candidate_email, created_by=recruiter.id)

            # Pitch
            pitch = _get_or_create_pitch(db, client.id, created_by=am.id)

            # JD
            jd = _get_or_create_jd(db, client.id, pitch.id, created_by=admin.id, assigned_recruiter_id=recruiter.id)

            # Application
            app = _get_or_create_application(db, candidate.id, jd.id, created_by=recruiter.id)

            # Status history (audit)
            _add_status_history(db, app.id, changed_by=recruiter.id, from_status=None, to_status="SOURCED", notes="Seeded")
            _add_status_history(db, app.id, changed_by=recruiter.id, from_status="SOURCED", to_status="SCREENED", notes="Auto-screened in seed")
            # keep application status aligned
            app.status = "SCREENED"

            # Interview
            _get_or_create_interview(db, app.id, created_by=recruiter.id)

            # Offer
            offer = _get_or_create_offer(db, app.id, created_by=admin.id)
            app.status = "OFFERED"

            # Joining
            _get_or_create_joining(db, app.id, offer.id, created_by=admin.id)

            db.commit()
            print("✅ Seed completed successfully.")
        except Exception as e:
            db.rollback()
            raise


if __name__ == "__main__":
    run_seed()
