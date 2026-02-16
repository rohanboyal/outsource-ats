"""
Offer model for managing job offers and negotiations.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Float, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from app.db.base import Base


class OfferStatus(str, PyEnum):
    """Offer status enumeration."""
    DRAFT = "draft"
    SENT = "sent"
    NEGOTIATING = "negotiating"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Offer(Base):
    """Offer model for tracking job offers."""
    
    __tablename__ = "offers"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Key
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    
    # Offer Details
    offer_number = Column(String(50), unique=True, nullable=False, index=True)
    designation = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    
    # Compensation Details
    ctc_annual = Column(Float, nullable=False)  # Total CTC
    fixed_component = Column(Float, nullable=True)
    variable_component = Column(Float, nullable=True)
    currency = Column(String(10), nullable=False, default="USD")
    
    # Additional Benefits (JSON)
    # Example: {"insurance": "Health + Dental", "pto": "20 days", "401k": "4% match"}
    other_benefits = Column(JSON, nullable=True)
    
    # Joining Information
    joining_date_proposed = Column(Date, nullable=True)
    offer_valid_till = Column(Date, nullable=True, index=True)
    
    # Status
    status = Column(
        Enum(OfferStatus),
        nullable=False,
        default=OfferStatus.DRAFT,
        index=True
    )
    
    # Versioning (for offer revisions)
    revision_number = Column(Integer, nullable=False, default=1)
    parent_offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)
    
    # Response Details
    acceptance_date = Column(Date, nullable=True)
    decline_reason = Column(Text, nullable=True)
    
    # Documents
    offer_letter_path = Column(String(500), nullable=True)
    
    # Negotiation Notes
    negotiation_notes = Column(Text, nullable=True)
    
    # Approval Workflow
    requires_approval = Column(Integer, default=0)  # 0=No, 1=Yes
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approval_notes = Column(Text, nullable=True)
    
    # Additional Details
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    sent_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    application = relationship("Application", back_populates="offers")
    creator = relationship("User", foreign_keys=[created_by], backref="created_offers")
    approver = relationship("User", foreign_keys=[approved_by], backref="approved_offers")
    parent_offer = relationship("Offer", remote_side=[id], backref="revisions")
    
    def __repr__(self) -> str:
        return f"<Offer(id={self.id}, offer_number={self.offer_number}, status={self.status})>"
    
    @property
    def is_active(self) -> bool:
        """Check if offer is active."""
        return self.status in [OfferStatus.SENT, OfferStatus.NEGOTIATING]
    
    @property
    def is_accepted(self) -> bool:
        """Check if offer was accepted."""
        return self.status == OfferStatus.ACCEPTED
    
    @property
    def is_latest_revision(self) -> bool:
        """Check if this is the latest revision."""
        return self.parent_offer_id is None or len(self.revisions) == 0
