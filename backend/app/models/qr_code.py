from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class QRCode(Base):
    __tablename__ = "qr_codes"

    qr_code_id = Column(String(100), primary_key=True, index=True)
    gate_id = Column(Integer, ForeignKey("gates.gate_id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    qr_type = Column(String(50), nullable=False, default="visitor")
    destination_url = Column(String(500), nullable=False)
    form_id = Column(String(100), ForeignKey("dynamic_forms.form_id", ondelete="SET NULL"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    gate = relationship("Gate", back_populates="qr_codes")
    form = relationship("DynamicForm", back_populates="qr_codes")
    responses = relationship("DynamicResponse", back_populates="qr_code", cascade="all, delete-orphan")
