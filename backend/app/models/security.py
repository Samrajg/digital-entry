from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.core.database import Base

class Security(Base):
    __tablename__ = "security"

    security_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    security_name = Column(String(255), nullable=False)
    security_pin = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
