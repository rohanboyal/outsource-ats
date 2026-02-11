"""
API dependencies for authentication and authorization.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_access_token
from app.core.permissions import UserRole, Permission, has_permission


# Security scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database session
        
    Returns:
        Current user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode token
        token = credentials.credentials
        payload = decode_access_token(token)
        
        if payload is None:
            raise credentials_exception
        
        # FIX: Get user_id as string and handle None properly
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        
        # FIX: Convert string to int explicitly
        try:
            user_id: int = int(user_id_str)
        except (ValueError, TypeError):
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user from database with proper int comparison
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    return user


class PermissionChecker:
    """
    Dependency class to check if user has required permission.
    
    Usage:
        @router.get("/endpoint")
        async def endpoint(
            current_user: User = Depends(PermissionChecker(Permission.VIEW_CLIENT))
        ):
            ...
    """
    
    def __init__(self, required_permission: Permission):
        """
        Initialize permission checker.
        
        Args:
            required_permission: Permission required to access the endpoint
        """
        self.required_permission = required_permission
    
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """
        Check if current user has required permission.
        
        Args:
            current_user: Current authenticated user
            
        Returns:
            Current user if authorized
            
        Raises:
            HTTPException: If user doesn't have required permission
        """
        # Admin has all permissions
        if current_user.is_admin:
            return current_user
        
        # Check if user's role has the required permission
        if not has_permission(current_user.role, self.required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {self.required_permission.value}"
            )
        
        return current_user


class RoleChecker:
    """
    Dependency class to check if user has required role.
    
    Usage:
        @router.get("/endpoint")
        async def endpoint(
            current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.RECRUITER]))
        ):
            ...
    """
    
    def __init__(self, allowed_roles: list[UserRole]):
        """
        Initialize role checker.
        
        Args:
            allowed_roles: List of roles allowed to access the endpoint
        """
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """
        Check if current user has one of the allowed roles.
        
        Args:
            current_user: Current authenticated user
            
        Returns:
            Current user if authorized
            
        Raises:
            HTTPException: If user doesn't have required role
        """
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {[role.value for role in self.allowed_roles]}"
            )
        
        return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None.
    Useful for endpoints that work both authenticated and unauthenticated.
    
    Args:
        credentials: HTTP Authorization credentials (optional)
        db: Database session
        
    Returns:
        Current user or None
    """
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials=credentials, db=db)
    except HTTPException:
        return None