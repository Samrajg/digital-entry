from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(String(100), ForeignKey("dynamic_forms.form_id", ondelete="CASCADE"), nullable=False, index=True)
    qr_code_id = Column(String(100), ForeignKey("qr_codes.qr_code_id", ondelete="CASCADE"), nullable=False, index=True)
    gate_id = Column(Integer, ForeignKey("gates.gate_id", ondelete="CASCADE"), nullable=False, index=True)
    security_id = Column(Integer, ForeignKey("security.security_id", ondelete="SET NULL"), nullable=True, index=True)
    form_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    checked_out_at = Column(DateTime, nullable=True)

    qr_code = relationship("QRCode")
    form = relationship("DynamicForm")
    gate = relationship("Gate")
    security = relationship("Security")
