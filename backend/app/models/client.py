"""
Client model for managing client companies.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from app.db.base import Base


class ClientStatus(str, PyEnum):
    """Client status enumeration."""
    PROSPECT = "prospect"
    ACTIVE = "active"
    INACTIVE = "inactive"


class Client(Base):
    """Client/Company model."""
    
    __tablename__ = "clients"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Company Information
    company_name = Column(String(255), nullable=False, index=True)
    industry = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    
    # Status
    status = Column(
        Enum(ClientStatus),
        nullable=False,
        default=ClientStatus.PROSPECT,
        index=True
    )
    
    # Account Management
    account_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # SLA Configuration
    default_sla_days = Column(Integer, nullable=True, default=7)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    account_manager = relationship("User", foreign_keys=[account_manager_id], backref="managed_clients")
    creator = relationship("User", foreign_keys=[created_by], backref="created_clients")
    contacts = relationship("ClientContact", back_populates="client", cascade="all, delete-orphan")
    pitches = relationship("Pitch", back_populates="client", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="client")
    
    def __repr__(self) -> str:
        return f"<Client(id={self.id}, company_name={self.company_name}, status={self.status})>"
    
    @property
    def is_active(self) -> bool:
        """Check if client is active."""
        return self.status == ClientStatus.ACTIVE and self.deleted_at is None


class ClientContact(Base):
    """Client contact person model."""
    
    __tablename__ = "client_contacts"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Key
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    
    # Contact Information
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    designation = Column(String(100), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    client = relationship("Client", back_populates="contacts")
    
    def __repr__(self) -> str:
        return f"<ClientContact(id={self.id}, name={self.name}, client_id={self.client_id})>"
