import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict

# Security Constants
HASH_NAME = "sha256"
ITERATIONS = 210000
DKLEN = 32

# We will use simple secure tokens stored in the database instead of JWTs to avoid dependencies.
# A token is 64 hex characters.

def hash_password(password: str, salt: Optional[bytes] = None) -> (str, str):
    """
    Hashes a password using PBKDF2-HMAC-SHA256.
    Returns (hex_hash, hex_salt).
    """
    if salt is None:
        salt = os.urandom(16)
        
    pwd_hash = hashlib.pbkdf2_hmac(
        hash_name=HASH_NAME,
        password=password.encode('utf-8'),
        salt=salt,
        iterations=ITERATIONS,
        dklen=DKLEN
    )
    return pwd_hash.hex(), salt.hex()

def verify_password(plain_password: str, hex_hash: str, hex_salt: str) -> bool:
    """
    Verifies a plain password against a stored hex hash and salt.
    """
    salt_bytes = bytes.fromhex(hex_salt)
    expected_hash = bytes.fromhex(hex_hash)
    
    computed_hash = hashlib.pbkdf2_hmac(
        hash_name=HASH_NAME,
        password=plain_password.encode('utf-8'),
        salt=salt_bytes,
        iterations=ITERATIONS,
        dklen=DKLEN
    )
    
    # Constant-time comparison to prevent timing attacks
    return secrets.compare_digest(computed_hash, expected_hash)

def generate_session_token() -> str:
    """
    Generates a cryptographically secure random session token.
    """
    return secrets.token_hex(32)
