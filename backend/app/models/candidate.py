"""
Candidate model for managing job applicants.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from app.db.base import Base


class CandidateSource(str, PyEnum):
    """Candidate source enumeration."""
    PORTAL = "portal"
    REFERRAL = "referral"
    DIRECT = "direct"
    VENDOR = "vendor"
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    NAUKRI = "naukri"
    OTHER = "other"


class Candidate(Base):
    """Candidate model."""
    
    __tablename__ = "candidates"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Personal Information
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    alternate_phone = Column(String(20), nullable=True)
    
    # Current Employment
    current_company = Column(String(255), nullable=True)
    current_designation = Column(String(255), nullable=True)
    total_experience = Column(Float, nullable=True)  # Years
    relevant_experience = Column(Float, nullable=True)  # Years
    
    # Skills
    skills = Column(JSON, nullable=True)  # Array of skill objects
    certifications = Column(JSON, nullable=True)  # Array of certifications
    
    # Resume Information
    resume_path = Column(String(500), nullable=True)
    resume_original_name = Column(String(255), nullable=True)
    resume_parsed_data = Column(JSON, nullable=True)  # Parsed resume data
    
    # Location Information
    current_location = Column(String(255), nullable=True)
    preferred_locations = Column(JSON, nullable=True)  # Array of preferred locations
    willing_to_relocate = Column(Integer, default=0)  # 0=No, 1=Yes
    
    # Availability
    notice_period_days = Column(Integer, nullable=True)
    availability_date = Column(DateTime(timezone=True), nullable=True)
    serving_notice_period = Column(Integer, default=0)  # 0=No, 1=Yes
    
    # Compensation
    current_ctc = Column(Float, nullable=True)  # Annual CTC
    expected_ctc = Column(Float, nullable=True)  # Annual CTC
    currency = Column(String(10), nullable=True, default="USD")
    
    # Source Information
    source = Column(
        Enum(CandidateSource),
        nullable=False,
        default=CandidateSource.DIRECT,
        index=True
    )
    source_details = Column(String(255), nullable=True)  # Referrer name, vendor name, etc.
    
    # Social Links
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    
    # Education
    highest_education = Column(String(100), nullable=True)
    education_details = Column(JSON, nullable=True)  # Array of education objects
    
    # Additional Information
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # Array of tags for categorization
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by], backref="created_candidates")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Candidate(id={self.id}, name={self.full_name}, email={self.email})>"
    
    @property
    def full_name(self) -> str:
        """Get candidate's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_available(self) -> bool:
        """Check if candidate is immediately available."""
        return self.notice_period_days == 0 or self.notice_period_days is None
    
    @property
    def has_resume(self) -> bool:
        """Check if candidate has uploaded resume."""
        return self.resume_path is not None
