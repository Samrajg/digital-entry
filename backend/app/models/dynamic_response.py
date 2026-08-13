from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class DynamicResponse(Base):
    __tablename__ = "dynamic_responses"

    response_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(String(100), ForeignKey("dynamic_forms.form_id", ondelete="CASCADE"), nullable=False, index=True)
    qr_code_id = Column(String(100), ForeignKey("qr_codes.qr_code_id", ondelete="CASCADE"), nullable=False, index=True)
    security_id = Column(Integer, ForeignKey("security.security_id", ondelete="SET NULL"), nullable=True, index=True)
    response_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    form = relationship("DynamicForm", back_populates="responses")
    qr_code = relationship("QRCode", back_populates="responses")
