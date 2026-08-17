from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class EntryCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=1, max_length=255)
    mobile_number: str = Field(..., min_length=1, max_length=20)
    purpose: str = Field(..., min_length=1)
    security_id: str = Field(..., min_length=1, max_length=50)

class EntryResponse(BaseModel):
    id: int
    qr_code_id: int
    full_name: str
    address: str
    mobile_number: str
    purpose: str
    security_id: str
    created_at: datetime

    class Config:
        from_attributes = True

from app.schemas.dynamic_form import FormFieldSchema
from typing import List

class PublicContextResponse(BaseModel):
    campusName: str
    gateName: str
    active: bool
    form_id: Optional[str] = None
    form_name: Optional[str] = None
    form_schema: Optional[List[FormFieldSchema]] = None
    qr_type: Optional[str] = None

class CheckoutSubmit(BaseModel):
    pass_id: int
    security_pin: str

class CheckoutResponse(BaseModel):
    message: str
    pass_id: int
    checked_out_at: datetime
    visit_duration_minutes: int
    campus_name: str
    gate_name: str
