from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.models.user import User

# TODO: Before Production:
# - Use bcrypt or Argon2 to hash and verify PINs.
# - Generate and return a secure JWT token instead of raw user details.

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, username: str, user_pin: str) -> User:
        user = UserRepository.get_user_by_username(db, username)

        # Check if user exists in the database
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or PIN"
            )
            
        from app.core.security import verify_password
        if not verify_password(user_pin, user.user_pin):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or PIN"
            )
            
        return user
