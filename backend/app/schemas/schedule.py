from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ScheduleCreate(BaseModel):
    visitor_name: str
    purpose: Optional[str] = None
    expected_date: date
    time_slot: Optional[str] = None
    campus_id: int
    gate_id: int

class ScheduleUpdateStatus(BaseModel):
    status: str

class ScheduleResponse(BaseModel):
    scheduled_visit_id: int
    visitor_name: str
    purpose: Optional[str] = None
    expected_date: date
    time_slot: Optional[str] = None
    campus_id: int
    gate_id: int
    qr_pass_value: str
    status: str
    created_at: datetime
    
    campus_name: Optional[str] = None
    gate_name: Optional[str] = None

    class Config:
        orm_mode = True
