"""
Security utilities for password hashing and JWT token handling.
FINAL VERSION – Argon2 only (no bcrypt, no 72-byte limit)
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from passlib.context import CryptContext
from jose import JWTError, jwt

from app.core.config import settings

# =============================================================================
# PASSWORD HASHING (ARGON2 ONLY)
# =============================================================================

# IMPORTANT:
# - bcrypt is NOT used at all
# - Argon2 has no 72-byte password limit
# - If Argon2 is missing, the app should FAIL fast (good)

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a password using Argon2.

    Args:
        password: Plain text password

    Returns:
        Secure Argon2 hash
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against an Argon2 hash.

    Args:
        plain_password: Plain text password
        hashed_password: Stored hash

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


# Aliases for compatibility with existing code
get_password_hash = hash_password
verify_password_hash = verify_password


# =============================================================================
# JWT TOKEN FUNCTIONS
# =============================================================================

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration override

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


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

    to_encode.update(
        {
            "exp": expire,
            "type": "refresh",
        }
    )

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token.

    Args:
        token: JWT token

    Returns:
        Token payload or None if invalid
    """
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError:
        return None


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode an access token.
    """
    return decode_token(token)


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a refresh token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        if payload.get("type") != "refresh":
            return None

        return payload
    except JWTError:
        return None


def verify_token(token: str) -> Optional[int]:
    """
    Verify token and extract user ID.

    Args:
        token: JWT token

    Returns:
        User ID or None
    """
    payload = decode_access_token(token)
    if payload is None:
        return None

    return payload.get("sub")


def verify_token_type(token: str, token_type: str) -> bool:
    """
    Verify token type (access or refresh).
    """
    payload = decode_token(token)
    if payload is None:
        return False

    if token_type == "access":
        return payload.get("type") in (None, "access")

    if token_type == "refresh":
        return payload.get("type") == "refresh"

    return False


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired.
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
    Extract user ID from token.
    """
    return verify_token(token)


def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Get token expiration datetime.
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
    """
    return decode_token(token)
