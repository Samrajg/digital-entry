from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth_service import AuthService

from app.core.security import create_access_token

router = APIRouter()

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, request.username, request.user_pin)
    
    access_token = create_access_token(
        data={"sub": str(user.user_id), "role": user.user_role}
    )
    
    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "user_role": user.user_role
        }
    }
