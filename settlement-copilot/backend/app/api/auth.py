from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.auth_utils import hash_password, verify_password, create_access_token
from app.config import AUTH_SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def register_user(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if not req.email or not req.password or not req.name:
        raise HTTPException(status_code=400, detail="Name, email, and password are required")
        
    email_normalized = req.email.strip().lower()
    existing_user = db.query(User).filter(User.identifier == email_normalized).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd, salt = hash_password(req.password)
    
    new_user = User(
        identifier=email_normalized,
        name=req.name.strip(),
        hashed_password=hashed_pwd,
        salt=salt,  # Will be None for bcrypt, which is expected
        role="FINANCE_ANALYST",
        is_active=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id), "email": new_user.identifier, "role": new_user.role},
        secret_key=AUTH_SECRET_KEY,
        expires_delta=access_token_expires
    )
    
    # Set HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="lax",
        secure=False  # Set to True in production (HTTPS)
    )
    
    return {
        "id": new_user.id,
        "email": new_user.identifier,
        "name": new_user.name,
        "role": new_user.role
    }

@router.post("/login")
def login_user(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    email_normalized = req.email.strip().lower()
    user = db.query(User).filter(User.identifier == email_normalized).first()
    
    # Generic error message to prevent enumeration
    invalid_creds_exc = HTTPException(status_code=401, detail="Invalid email or password.")
    
    if not user or not user.hashed_password:
        raise invalid_creds_exc
        
    if getattr(user, 'is_active', 1) == 0:
        raise invalid_creds_exc
        
    if not verify_password(req.password, user.hashed_password, user.salt):
        raise invalid_creds_exc
        
    # Seamless migration: if the user still has a PBKDF2 salt, re-hash with bcrypt and clear salt
    if user.salt:
        new_hashed, new_salt = hash_password(req.password)
        user.hashed_password = new_hashed
        user.salt = new_salt
        db.commit()
        logger.info(f"Upgraded password hash to bcrypt for user {user.id}")
    
    # Generate JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.identifier, "role": user.role},
        secret_key=AUTH_SECRET_KEY,
        expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="lax",
        secure=False
    )
    
    return {
        "id": user.id,
        "email": user.identifier,
        "name": user.name,
        "role": user.role
    }

@router.post("/logout")
def logout_user(response: Response):
    response.delete_cookie("access_token")
    return {"status": "logged_out"}

@router.get("/me")
def get_current_user_info(request: Request, db: Session = Depends(get_db)):
    from app.api.deps import get_current_user
    user = get_current_user(request, db)
    return {
        "id": user.id,
        "email": user.identifier,
        "name": user.name,
        "role": user.role
    }
