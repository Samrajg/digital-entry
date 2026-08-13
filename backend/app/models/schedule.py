from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ScheduledVisit(Base):
    __tablename__ = "scheduled_visits"

    scheduled_visit_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    visitor_name = Column(String(255), nullable=False)
    purpose = Column(String(255), nullable=True)
    expected_date = Column(Date, nullable=False, index=True)
    time_slot = Column(String(50), nullable=True)
    
    campus_id = Column(Integer, ForeignKey("campuses.campus_id", ondelete="CASCADE"), nullable=True)
    gate_id = Column(Integer, ForeignKey("gates.gate_id", ondelete="CASCADE"), nullable=True)
    
    qr_pass_value = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), default="PENDING")
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    campus = relationship("Campus")
    gate = relationship("Gate")
