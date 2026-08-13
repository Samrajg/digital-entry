from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class GateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=255)

class GateCreate(GateBase):
    pass

class GateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=255)

class GateStatusUpdate(BaseModel):
    is_active: bool

class GateResponse(GateBase):
    gate_id: int
    campus_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class QRCodeResponseShort(BaseModel):
    qr_code_id: int
    code: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True

class GateDetailResponse(GateResponse):
    campus_name: str
    qr_codes: List[QRCodeResponseShort] = []

    class Config:
        from_attributes = True
