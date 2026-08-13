from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class QRCodeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class QRCodeCreate(QRCodeBase):
    pass

class QRCodeStatusUpdate(BaseModel):
    is_active: bool

class QRCodeResponse(BaseModel):
    qr_code_id: int
    gate_id: int
    gate_name: str
    campus_id: int
    campus_name: str
    code: str
    name: str
    destination_url: str
    is_active: bool
    qr_image_base64: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
