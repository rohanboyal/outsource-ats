"""
User model for authentication and authorization.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from datetime import datetime

from app.db.base import Base
from app.core.permissions import UserRole


class User(Base):
    """User model for system users."""
    
    __tablename__ = "users"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Authentication
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile Information
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Role and Permissions
    role = Column(
        Enum(UserRole),
        nullable=False,
        default=UserRole.RECRUITER
    )
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Soft Delete
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN
    
    @property
    def is_deleted(self) -> bool:
        """Check if user is soft deleted."""
        return self.deleted_at is not None
