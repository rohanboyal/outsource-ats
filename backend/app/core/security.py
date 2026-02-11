"""
Security utilities for password hashing and JWT token handling.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================================
# PASSWORD FUNCTIONS
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


# Aliases for compatibility
get_password_hash = hash_password  # Alias for auth.py compatibility
verify_password_hash = verify_password  # Alternative name


# ============================================================================
# JWT TOKEN FUNCTIONS
# ============================================================================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Token expiration time (default: 30 minutes)
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Data to encode in the token
        
    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token (generic function).
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token payload or None if invalid
    """
    return decode_token(token)


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT refresh token.
    
    Args:
        token: JWT refresh token to decode
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            return None
        
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> Optional[int]:
    """
    Verify a token and extract user ID.
    
    Args:
        token: JWT token to verify
        
    Returns:
        User ID if token is valid, None otherwise
    """
    payload = decode_access_token(token)
    
    if payload is None:
        return None
    
    user_id: Optional[int] = payload.get("sub")
    return user_id


def verify_token_type(token: str, token_type: str) -> bool:
    """
    Verify token type (access or refresh).
    
    Args:
        token: JWT token to verify
        token_type: Expected token type ('access' or 'refresh')
        
    Returns:
        True if token is of correct type, False otherwise
    """
    payload = decode_token(token)
    
    if payload is None:
        return False
    
    # Access tokens don't have 'type' field (or have type='access')
    if token_type == "access":
        token_type_field = payload.get("type")
        return token_type_field is None or token_type_field == "access"
    
    # Refresh tokens have type='refresh'
    if token_type == "refresh":
        return payload.get("type") == "refresh"
    
    return False


# Additional utility functions for token validation
def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired.
    
    Args:
        token: JWT token to check
        
    Returns:
        True if token is expired, False otherwise
    """
    payload = decode_access_token(token)
    
    if payload is None:
        return True
    
    exp = payload.get("exp")
    if exp is None:
        return True
    
    return datetime.utcnow().timestamp() > exp


def extract_user_id_from_token(token: str) -> Optional[int]:
    """
    Extract user ID from token without full verification.
    
    Args:
        token: JWT token
        
    Returns:
        User ID or None
    """
    return verify_token(token)


def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Get token expiration datetime.
    
    Args:
        token: JWT token
        
    Returns:
        Expiration datetime or None
    """
    payload = decode_token(token)
    
    if payload is None:
        return None
    
    exp = payload.get("exp")
    if exp is None:
        return None
    
    return datetime.fromtimestamp(exp)


def get_token_payload(token: str) -> Optional[Dict[str, Any]]:
    """
    Get full token payload.
    
    Args:
        token: JWT token
        
    Returns:
        Token payload or None
    """
    return decode_token(token)