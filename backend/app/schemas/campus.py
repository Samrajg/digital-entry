from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CampusBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)

class CampusCreate(CampusBase):
    pass

class CampusUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)

class CampusStatusUpdate(BaseModel):
    is_active: bool

class CampusResponse(CampusBase):
    campus_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Extended schema to return details with associated gates
class GateResponseShort(BaseModel):
    gate_id: int
    name: str
    code: str
    is_active: bool

    class Config:
        from_attributes = True

class CampusDetailResponse(CampusResponse):
    gates: List[GateResponseShort] = []

    class Config:
        from_attributes = True
