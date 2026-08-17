from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AppointmentCreate(BaseModel):
    visitor_name: str
    visitor_email: Optional[str] = None
    visitor_phone: Optional[str] = None
    visitor_count: int = 1
    purpose: str
    campus_id: int
    meeting_location: str
    department: Optional[str] = None
    appointment_date: date
    time_slot_start: str
    time_slot_end: str
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    appointment_id: int
    appointment_code: str
    visitor_name: str
    visitor_email: Optional[str] = None
    visitor_phone: Optional[str] = None
    visitor_count: int
    purpose: str
    campus_id: int
    campus_name: str = ""
    meeting_location: str
    employee_name: str
    department: Optional[str] = None
    appointment_date: date
    time_slot_start: str
    time_slot_end: str
    status: str
    notes: Optional[str] = None
    qr_image_base64: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AppointmentCheckin(BaseModel):
    security_pin: str
    gate_id: int
