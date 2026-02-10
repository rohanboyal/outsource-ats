"""
API dependencies for dependency injection.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import decode_token, verify_token_type
from app.core.permissions import UserRole, Permission, require_permission
from app.models.user import User


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials
        db: Database session
        
    Returns:
        Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Decode token
    payload = decode_token(credentials.credentials)
    
    # Verify token type
    verify_token_type(payload, "access")
    
    # Get user ID from token
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Check if user is deleted
    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deleted"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (additional validation).
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        Current active user
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not active"
        )
    return current_user


class PermissionChecker:
    """
    Dependency class to check if user has required permission.
    
    Usage:
        @app.get("/clients", dependencies=[Depends(PermissionChecker(Permission.VIEW_CLIENT))])
        def get_clients():
            ...
    """
    
    def __init__(self, required_permission: Permission):
        self.required_permission = required_permission
    
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """Check if user has required permission."""
        require_permission(current_user.role, self.required_permission)
        return current_user


class RoleChecker:
    """
    Dependency class to check if user has required role.
    
    Usage:
        @app.get("/admin", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
        def admin_only():
            ...
    """
    
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """Check if user has allowed role."""
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in self.allowed_roles]}"
            )
        return current_user


# Common dependency combinations
def get_admin_user(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN]))
) -> User:
    """Get current user if they are an admin."""
    return current_user


def get_recruiter_or_admin(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.RECRUITER]))
) -> User:
    """Get current user if they are a recruiter or admin."""
    return current_user
