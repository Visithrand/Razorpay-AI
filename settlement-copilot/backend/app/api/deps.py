from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.auth_utils import verify_access_token
from app.config import AUTH_SECRET_KEY

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token_str = request.cookies.get("access_token")
    if not token_str or not token_str.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
        
    token = token_str.split(" ")[1]
    payload = verify_access_token(token, AUTH_SECRET_KEY)
    
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
        
    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    if getattr(user, 'is_active', 1) == 0:
        raise HTTPException(status_code=401, detail="Account is disabled")
        
    return user

def require_operator(user: User = Depends(get_current_user)) -> User:
    """Enforces that the user has at least FINANCE_OPERATOR privileges."""
    if user.role not in ["FINANCE_OPERATOR", "FINANCE_ANALYST", "FINANCE_MANAGER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    """Enforces that the user has ADMIN privileges."""
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return user
