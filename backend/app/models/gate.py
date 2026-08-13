from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Gate(Base):
    __tablename__ = "gates"

    gate_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    campus_id = Column(Integer, ForeignKey("campuses.campus_id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    campus = relationship("Campus", back_populates="gates")
    qr_codes = relationship("QRCode", back_populates="gate", cascade="all, delete-orphan")
