from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class QRCodeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    qr_type: Optional[str] = "visitor"

class QRCodeCreate(QRCodeBase):
    qr_code_id: str = Field(..., min_length=1, max_length=100)
    form_id: str = Field(..., min_length=1, max_length=100)

class QRCodeStatusUpdate(BaseModel):
    is_active: bool

class QRCodeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    form_id: Optional[str] = None
    qr_type: Optional[str] = None

class QRCodeResponse(BaseModel):
    qr_code_id: str
    gate_id: int
    gate_name: str
    campus_id: int
    campus_name: str
    code: str
    name: str
    destination_url: str
    is_active: bool
    qr_type: str
    qr_image_base64: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
