from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, index=True)
    qr_code_id = Column(Integer, ForeignKey("qr_codes.qr_code_id", ondelete="CASCADE"), nullable=False)
    
    full_name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    mobile_number = Column(String(20), nullable=False)
    purpose = Column(Text, nullable=False)
    security_id = Column(String(50), nullable=False) # e.g., Guard's ID or PIN

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    qr_code = relationship("QRCode")
