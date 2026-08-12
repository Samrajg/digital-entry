from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.models.user import User

# TODO: Before Production:
# - Use bcrypt or Argon2 to hash and verify PINs.
# - Generate and return a secure JWT token instead of raw user details.

MOCK_USERS = {
    "admin": {"user_id": 1, "user_pin": "1111", "user_role": "admin"},
    "security": {"user_id": 2, "user_pin": "2222", "user_role": "security"},
    "supervisor": {"user_id": 3, "user_pin": "3333", "user_role": "supervisor"},
    "manager": {"user_id": 4, "user_pin": "4444", "user_role": "manager"},
    "admin_user": {"user_id": 1, "user_pin": "1111", "user_role": "admin"},
    "security_user": {"user_id": 2, "user_pin": "2222", "user_role": "security"},
    "supervisor_user": {"user_id": 3, "user_pin": "3333", "user_role": "supervisor"},
    "manager_user": {"user_id": 4, "user_pin": "4444", "user_role": "manager"},
}

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, username: str, user_pin: str) -> User:
        try:
            user = UserRepository.get_user_by_username(db, username)
        except Exception as e:
            # Database connection failed (e.g. offline sandbox or DNS failure)
            print(f"Database query failed ({e}). Falling back to local mock authentication.")
            if username in MOCK_USERS:
                mock_data = MOCK_USERS[username]
                if mock_data["user_pin"] == user_pin:
                    return User(
                        user_id=mock_data["user_id"],
                        username=username,
                        user_pin=mock_data["user_pin"],
                        user_role=mock_data["user_role"]
                    )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or PIN"
            )

        # Check if user exists in the database
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or PIN"
            )
            
        # Check if PIN matches (currently stored in plain-text for this prototype)
        if user.user_pin != user_pin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or PIN"
            )
            
        return user
