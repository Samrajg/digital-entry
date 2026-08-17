from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_code = Column(String(100), unique=True, index=True, nullable=False)
    
    # Who created it (employee)
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    employee_name = Column(String(255), nullable=False)  # Denormalized for display
    department = Column(String(255), nullable=True)
    
    # Visitor details
    visitor_name = Column(String(255), nullable=False)
    visitor_email = Column(String(255), nullable=True)
    visitor_phone = Column(String(50), nullable=True)
    visitor_count = Column(Integer, default=1)
    
    # Meeting details
    purpose = Column(String(500), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.campus_id", ondelete="CASCADE"), nullable=False)
    meeting_location = Column(String(500), nullable=False)
    
    # Schedule
    appointment_date = Column(Date, nullable=False, index=True)
    time_slot_start = Column(String(10), nullable=False)
    time_slot_end = Column(String(10), nullable=False)
    
    # Status lifecycle
    status = Column(String(50), default="SCHEDULED", index=True)
    
    notes = Column(String(500), nullable=True)
    
    # Tracking
    checked_in_at = Column(DateTime, nullable=True)
    checked_in_gate_id = Column(Integer, ForeignKey("gates.gate_id", ondelete="SET NULL"), nullable=True)
    checked_in_security_id = Column(Integer, ForeignKey("security.security_id", ondelete="SET NULL"), nullable=True)
    visitor_record_id = Column(Integer, ForeignKey("visitors.visitor_id", ondelete="SET NULL"), nullable=True) 
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User")
    campus = relationship("Campus")
    gate = relationship("Gate", foreign_keys=[checked_in_gate_id])
    security = relationship("Security")
    visitor_record = relationship("Visitor", foreign_keys=[visitor_record_id])
