import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from passlib.context import CryptContext
import jwt

# Security Constants for legacy PBKDF2
HASH_NAME = "sha256"
ITERATIONS = 210000
DKLEN = 32

# Configure passlib for bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> Tuple[str, Optional[str]]:
    """
    Hashes a password using bcrypt.
    Returns (hash, None) since bcrypt includes the salt in the hash.
    The None is returned for backwards compatibility with functions expecting a salt.
    """
    hashed = pwd_context.hash(password)
    return hashed, None

def verify_password(plain_password: str, stored_hash: str, hex_salt: Optional[str] = None) -> bool:
    """
    Verifies a plain password against a stored hash.
    Supports both legacy PBKDF2 (if hex_salt is provided) and bcrypt (if hex_salt is None).
    """
    if hex_salt:
        # Legacy PBKDF2 verification
        try:
            salt_bytes = bytes.fromhex(hex_salt)
            expected_hash = bytes.fromhex(stored_hash)
            
            computed_hash = hashlib.pbkdf2_hmac(
                hash_name=HASH_NAME,
                password=plain_password.encode('utf-8'),
                salt=salt_bytes,
                iterations=ITERATIONS,
                dklen=DKLEN
            )
            return secrets.compare_digest(computed_hash, expected_hash)
        except Exception:
            return False
    else:
        # Bcrypt verification
        return pwd_context.verify(plain_password, stored_hash)

def generate_session_token() -> str:
    """
    Generates a cryptographically secure random session token.
    Used for backwards compatibility if needed.
    """
    return secrets.token_hex(32)

def create_access_token(data: dict, secret_key: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt

def verify_access_token(token: str, secret_key: str) -> Optional[dict]:
    """
    Verify a JWT access token and return the payload.
    """
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return None
