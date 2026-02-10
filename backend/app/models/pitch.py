"""
Pitch model for business development and client pitches.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from app.db.base import Base


class PitchStatus(str, PyEnum):
    """Pitch status enumeration."""
    DRAFT = "draft"
    SENT = "sent"
    APPROVED = "approved"
    REJECTED = "rejected"
    CONVERTED = "converted"


class Pitch(Base):
    """Pitch model for tracking business development pitches."""
    
    __tablename__ = "pitches"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Keys
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    
    # Pitch Information
    pitch_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Proposed Roles (JSON array)
    # Example: [{"title": "Senior Developer", "count": 5, "rate": 5000}]
    proposed_roles = Column(JSON, nullable=True)
    
    expected_headcount = Column(Integer, nullable=True)
    
    # Rate Card (JSON)
    # Example: {"currency": "USD", "billing_type": "monthly", "rates": {...}}
    rate_card = Column(JSON, nullable=True)
    
    # Status Tracking
    status = Column(
        Enum(PitchStatus),
        nullable=False,
        default=PitchStatus.DRAFT,
        index=True
    )
    
    # Important Dates
    sent_date = Column(Date, nullable=True)
    decision_date = Column(Date, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    client = relationship("Client", back_populates="pitches")
    creator = relationship("User", foreign_keys=[created_by], backref="created_pitches")
    job_descriptions = relationship("JobDescription", back_populates="pitch")
    
    def __repr__(self) -> str:
        return f"<Pitch(id={self.id}, title={self.pitch_title}, status={self.status})>"
    
    @property
    def is_convertible(self) -> bool:
        """Check if pitch can be converted to JD."""
        return self.status == PitchStatus.APPROVED
    
    @property
    def is_editable(self) -> bool:
        """Check if pitch can be edited."""
        return self.status in [PitchStatus.DRAFT, PitchStatus.SENT]
