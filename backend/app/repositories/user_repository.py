from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User

class UserRepository:
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def create_user(db: Session, username: str, user_pin: str, user_role: str) -> User:
        user = User(
            username=username,
            user_pin=user_pin,
            user_role=user_role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
