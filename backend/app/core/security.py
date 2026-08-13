from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User

def get_current_user(
    x_user_id: int = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db)
) -> User:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing (X-User-Id header)"
        )
    
    try:
        user = db.query(User).filter(User.user_id == x_user_id).first()
    except Exception:
        # Fallback if connection fails
        user = None
        
    if not user:
        # Fallback check against in-memory MOCK_USERS for offline testing
        from app.services.auth_service import MOCK_USERS
        mock_user = next((u for name, u in MOCK_USERS.items() if u["user_id"] == x_user_id), None)
        if mock_user:
            username = next(name for name, u in MOCK_USERS.items() if u["user_id"] == x_user_id)
            return User(
                user_id=mock_user["user_id"],
                username=username,
                user_pin=mock_user["user_pin"],
                user_role=mock_user["user_role"]
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user session"
        )
    return user

def require_roles(allowed_roles: list[str]):
    def dependency(user: User = Depends(get_current_user)):
        if user.user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your security role"
            )
        return user
    return dependency
