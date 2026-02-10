"""
Job Description model for managing open positions.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from app.db.base import Base


class ContractType(str, PyEnum):
    """Contract type enumeration."""
    FULL_TIME = "full_time"
    CONTRACT = "contract"
    PART_TIME = "part_time"
    TEMP_TO_PERM = "temp_to_perm"


class JDStatus(str, PyEnum):
    """Job Description status enumeration."""
    DRAFT = "draft"
    OPEN = "open"
    ON_HOLD = "on_hold"
    CLOSED = "closed"


class JDPriority(str, PyEnum):
    """Job Description priority enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class JobDescription(Base):
    """Job Description model."""
    
    __tablename__ = "job_descriptions"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Keys
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    pitch_id = Column(Integer, ForeignKey("pitches.id"), nullable=True, index=True)
    assigned_recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # JD Information
    jd_code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Requirements
    required_skills = Column(JSON, nullable=True)  # Array of skills
    preferred_skills = Column(JSON, nullable=True)  # Array of skills
    experience_min = Column(Float, nullable=True)  # Years
    experience_max = Column(Float, nullable=True)  # Years
    
    # Location and Work Details
    location = Column(String(255), nullable=True)
    work_mode = Column(String(50), nullable=True)  # remote, hybrid, onsite
    contract_type = Column(
        Enum(ContractType),
        nullable=False,
        default=ContractType.FULL_TIME
    )
    
    # Position Details
    open_positions = Column(Integer, nullable=False, default=1)
    filled_positions = Column(Integer, nullable=False, default=0)
    
    # Status and Priority
    status = Column(
        Enum(JDStatus),
        nullable=False,
        default=JDStatus.DRAFT,
        index=True
    )
    priority = Column(
        Enum(JDPriority),
        nullable=False,
        default=JDPriority.MEDIUM,
        index=True
    )
    
    # SLA Configuration
    sla_days = Column(Integer, nullable=True, default=7)
    
    # Versioning
    version = Column(Integer, nullable=False, default=1)
    parent_jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    
    # Additional Information
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True, default="USD")
    benefits = Column(Text, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    client = relationship("Client", back_populates="job_descriptions")
    pitch = relationship("Pitch", back_populates="job_descriptions")
    assigned_recruiter = relationship("User", foreign_keys=[assigned_recruiter_id], backref="assigned_jds")
    creator = relationship("User", foreign_keys=[created_by], backref="created_jds")
    applications = relationship("Application", back_populates="job_description", cascade="all, delete-orphan")
    parent_jd = relationship("JobDescription", remote_side=[id], backref="versions")
    
    def __repr__(self) -> str:
        return f"<JobDescription(id={self.id}, jd_code={self.jd_code}, title={self.title})>"
    
    @property
    def is_open(self) -> bool:
        """Check if JD is open for applications."""
        return self.status == JDStatus.OPEN and self.remaining_positions > 0
    
    @property
    def remaining_positions(self) -> int:
        """Get number of remaining positions."""
        return max(0, self.open_positions - self.filled_positions)
    
    @property
    def is_editable(self) -> bool:
        """Check if JD can be edited."""
        return self.status != JDStatus.CLOSED
