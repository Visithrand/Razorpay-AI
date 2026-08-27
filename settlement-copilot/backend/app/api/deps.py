from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user = db.query(User).filter(User.session_token == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
        
    return user

def require_operator(user: User = Depends(get_current_user)) -> User:
    """Enforces that the user has at least FINANCE_OPERATOR privileges."""
    if user.role not in ["FINANCE_OPERATOR", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    """Enforces that the user has ADMIN privileges."""
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return user
