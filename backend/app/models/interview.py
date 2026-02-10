"""
Interview model for managing interview rounds and feedback.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from app.db.base import Base


class InterviewMode(str, PyEnum):
    """Interview mode enumeration."""
    PHONE = "phone"
    VIDEO = "video"
    IN_PERSON = "in_person"
    TECHNICAL_TEST = "technical_test"


class InterviewStatus(str, PyEnum):
    """Interview status enumeration."""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"


class InterviewResult(str, PyEnum):
    """Interview result enumeration."""
    SELECTED = "selected"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"
    PENDING = "pending"


class Interview(Base):
    """Interview model for tracking interview rounds."""
    
    __tablename__ = "interviews"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Key
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    
    # Interview Details
    round_number = Column(Integer, nullable=False, default=1)
    round_name = Column(String(100), nullable=False)  # e.g., "Technical Round 1", "HR Round"
    
    # Scheduling
    scheduled_date = Column(DateTime(timezone=True), nullable=True, index=True)
    duration_minutes = Column(Integer, nullable=True, default=60)
    
    # Interviewer Information
    interviewer_name = Column(String(255), nullable=True)
    interviewer_email = Column(String(255), nullable=True)
    interviewer_designation = Column(String(100), nullable=True)
    is_client_interview = Column(Boolean, default=False)  # Internal vs Client interview
    
    # Interview Mode
    interview_mode = Column(
        Enum(InterviewMode),
        nullable=False,
        default=InterviewMode.VIDEO
    )
    meeting_link = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)  # For in-person interviews
    
    # Status
    status = Column(
        Enum(InterviewStatus),
        nullable=False,
        default=InterviewStatus.SCHEDULED,
        index=True
    )
    
    # Feedback
    feedback = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 or 1-10
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    
    # Result
    result = Column(
        Enum(InterviewResult),
        nullable=True,
        default=InterviewResult.PENDING,
        index=True
    )
    
    # Next Steps
    next_round_scheduled = Column(Boolean, default=False)
    additional_notes = Column(Text, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    application = relationship("Application", back_populates="interviews")
    creator = relationship("User", foreign_keys=[created_by], backref="created_interviews")
    
    def __repr__(self) -> str:
        return f"<Interview(id={self.id}, round={self.round_name}, status={self.status})>"
    
    @property
    def is_completed(self) -> bool:
        """Check if interview is completed."""
        return self.status == InterviewStatus.COMPLETED
    
    @property
    def is_upcoming(self) -> bool:
        """Check if interview is upcoming."""
        return self.status == InterviewStatus.SCHEDULED
