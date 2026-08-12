from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base

# TODO: Before Production:
# - PINs must be hashed (do not store plain text).
# - Proper JWT/session authentication must be implemented.
# - Protected routes must be added.
# - Role-based authorization must be enforced on the backend.

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    user_pin = Column(String, nullable=False)
    user_role = Column(String, nullable=False)  # Allowed: admin, security, supervisor, manager
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
