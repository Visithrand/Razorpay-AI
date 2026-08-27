from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.auth_utils import hash_password, verify_password, generate_session_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register_user(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if not req.email or not req.password or not req.name:
        raise HTTPException(status_code=400, detail="Name, email, and password are required")
        
    existing_user = db.query(User).filter(User.identifier == req.email.strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd, salt = hash_password(req.password)
    session_token = generate_session_token()
    
    new_user = User(
        identifier=req.email.strip(),
        name=req.name.strip(),
        hashed_password=hashed_pwd,
        salt=salt,
        session_token=session_token,
        role="FINANCE_OPERATOR"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Set HttpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
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
    user = db.query(User).filter(User.identifier == req.email.strip()).first()
    
    if not user or not user.hashed_password or not user.salt:
        # Generic error message to prevent enumeration
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not verify_password(req.password, user.hashed_password, user.salt):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Rotate token on login for security
    session_token = generate_session_token()
    user.session_token = session_token
    db.commit()
    
    response.set_cookie(
        key="session_token",
        value=session_token,
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
def logout_user(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("session_token")
    if token:
        user = db.query(User).filter(User.session_token == token).first()
        if user:
            user.session_token = None
            db.commit()
            
    response.delete_cookie("session_token")
    return {"status": "logged_out"}

@router.get("/me")
def get_current_user_info(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user = db.query(User).filter(User.session_token == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
        
    return {
        "id": user.id,
        "email": user.identifier,
        "name": user.name,
        "role": user.role
    }
