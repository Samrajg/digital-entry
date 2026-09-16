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


# BUG-10 FIX: Added missing update schema used by PUT /api/appointments/{id}.
# All fields are optional so the caller only needs to send what changed.
class AppointmentUpdate(BaseModel):
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
    visitor_phone: Optional[str] = None
    visitor_count: Optional[int] = None
    purpose: Optional[str] = None
    campus_id: Optional[int] = None
    meeting_location: Optional[str] = None
    department: Optional[str] = None
    appointment_date: Optional[date] = None
    time_slot_start: Optional[str] = None
    time_slot_end: Optional[str] = None
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
