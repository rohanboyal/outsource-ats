"""
Joining model for managing candidate onboarding and joining confirmation.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from app.db.base import Base


class JoiningStatus(str, PyEnum):
    """Joining status enumeration."""
    CONFIRMED = "confirmed"
    NO_SHOW = "no_show"
    DELAYED = "delayed"
    REPLACEMENT_REQUIRED = "replacement_required"


class Joining(Base):
    """Joining model for tracking candidate joining and onboarding."""
    
    __tablename__ = "joinings"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Keys
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=False, index=True)
    
    # Joining Details
    actual_joining_date = Column(Date, nullable=True, index=True)
    expected_joining_date = Column(Date, nullable=True)
    
    # Client Employee Details
    employee_id = Column(String(100), nullable=True)  # Client's employee ID
    work_email = Column(String(255), nullable=True)
    reporting_manager = Column(String(255), nullable=True)
    
    # Status
    status = Column(
        Enum(JoiningStatus),
        nullable=False,
        default=JoiningStatus.CONFIRMED,
        index=True
    )
    
    # No Show Information
    no_show_reason = Column(Text, nullable=True)
    no_show_date = Column(Date, nullable=True)
    
    # Replacement Information
    replacement_window_days = Column(Integer, nullable=True, default=30)
    replacement_initiated = Column(Integer, default=0)  # 0=No, 1=Yes
    replacement_application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    
    # Document Checklist (JSON)
    # Example: [{"name": "ID Proof", "submitted": true, "verified": true}, ...]
    documents_collected = Column(JSON, nullable=True)
    
    # Onboarding Status (JSON)
    # Example: {"orientation": "completed", "system_access": "pending", ...}
    onboarding_status = Column(JSON, nullable=True)
    
    # Additional Information
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    application = relationship("Application", back_populates="joining", foreign_keys=[application_id])
    offer = relationship("Offer", backref="joining")
    creator = relationship("User", foreign_keys=[created_by], backref="created_joinings")
    replacement_application = relationship("Application", foreign_keys=[replacement_application_id], backref="replacement_for")
    
    def __repr__(self) -> str:
        return f"<Joining(id={self.id}, application_id={self.application_id}, status={self.status})>"
    
    @property
    def has_joined(self) -> bool:
        """Check if candidate has actually joined."""
        return self.actual_joining_date is not None and self.status == JoiningStatus.CONFIRMED
    
    @property
    def needs_replacement(self) -> bool:
        """Check if replacement is needed."""
        return self.status == JoiningStatus.REPLACEMENT_REQUIRED
