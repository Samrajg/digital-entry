from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class DynamicForm(Base):
    __tablename__ = "dynamic_forms"

    form_id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    schema = Column(JSONB, nullable=False, server_default='[]')
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    qr_codes = relationship("QRCode", back_populates="form")
    responses = relationship("DynamicResponse", back_populates="form", cascade="all, delete-orphan")
