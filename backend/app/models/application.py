"""
Application model for tracking candidate applications to job descriptions.
This is the core model that connects candidates to JDs and tracks their journey.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from datetime import datetime

from app.db.base import Base


class ApplicationStatus(str, PyEnum):
    """Application status enumeration - represents the hiring pipeline stages."""
    SOURCED = "sourced"  # Candidate identified
    SCREENED = "screened"  # Initial screening done
    SUBMITTED = "submitted"  # Submitted to client
    INTERVIEWING = "interviewing"  # In interview process
    OFFERED = "offered"  # Offer extended
    JOINED = "joined"  # Candidate joined
    REJECTED = "rejected"  # Rejected at any stage
    WITHDRAWN = "withdrawn"  # Candidate withdrew


class SLAStatus(str, PyEnum):
    """SLA tracking status."""
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    BREACHED = "breached"


class Application(Base):
    """Application model - tracks candidate journey for a specific JD."""
    
    __tablename__ = "applications"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Keys - Core Relationships
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, index=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False, index=True)
    
    # Status Tracking
    status = Column(
        Enum(ApplicationStatus),
        nullable=False,
        default=ApplicationStatus.SOURCED,
        index=True
    )
    substatus = Column(String(100), nullable=True)  # Optional detailed status
    
    # Screening Information
    screening_notes = Column(Text, nullable=True)
    internal_rating = Column(Integer, nullable=True)  # 1-5 rating
    screened_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    screened_at = Column(DateTime(timezone=True), nullable=True)
    
    # Client Submission
    submitted_to_client_date = Column(Date, nullable=True, index=True)
    client_submission_notes = Column(Text, nullable=True)
    
    # SLA Tracking
    sla_start_date = Column(Date, nullable=True)
    sla_end_date = Column(Date, nullable=True)
    sla_status = Column(
        Enum(SLAStatus),
        nullable=True,
        default=SLAStatus.ON_TRACK,
        index=True
    )
    
    # Rejection Information
    rejection_reason = Column(Text, nullable=True)
    rejection_stage = Column(String(50), nullable=True)
    rejected_by = Column(String(100), nullable=True)  # Internal or Client
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    
    # Withdrawal Information
    withdrawal_reason = Column(Text, nullable=True)
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    candidate = relationship("Candidate", back_populates="applications")
    job_description = relationship("JobDescription", back_populates="applications")
    creator = relationship("User", foreign_keys=[created_by], backref="created_applications")
    screener = relationship("User", foreign_keys=[screened_by], backref="screened_applications")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="application", cascade="all, delete-orphan")
    joining = relationship("Joining", back_populates="application", uselist=False, cascade="all, delete-orphan", foreign_keys="Joining.application_id")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Application(id={self.id}, candidate_id={self.candidate_id}, jd_id={self.jd_id}, status={self.status})>"
    
    @property
    def is_active(self) -> bool:
        """Check if application is still active in the pipeline."""
        return self.status not in [
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
            ApplicationStatus.JOINED
        ]
    
    @property
    def is_submitted(self) -> bool:
        """Check if application has been submitted to client."""
        return self.submitted_to_client_date is not None
    
    @property
    def days_in_pipeline(self) -> int:
        """Calculate days in pipeline."""
        return (datetime.utcnow() - self.created_at).days if self.created_at else 0


class ApplicationStatusHistory(Base):
    """Track status changes for applications (audit trail)."""
    
    __tablename__ = "application_status_history"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Key
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    
    # Status Change Details
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    
    # Change Information
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    application = relationship("Application", back_populates="status_history")
    changer = relationship("User", foreign_keys=[changed_by], backref="status_changes")
    
    def __repr__(self) -> str:
        return f"<ApplicationStatusHistory(id={self.id}, application_id={self.application_id}, {self.from_status} -> {self.to_status})>"
