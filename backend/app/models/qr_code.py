from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class QRCode(Base):
    __tablename__ = "qr_codes"

    qr_code_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    gate_id = Column(Integer, ForeignKey("gates.gate_id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    destination_url = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    gate = relationship("Gate", back_populates="qr_codes")
