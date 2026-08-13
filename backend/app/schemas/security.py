from pydantic import BaseModel, Field, constr
from datetime import datetime
from typing import Optional

class SecurityCreate(BaseModel):
    security_name: str = Field(..., min_length=1, max_length=255)
    security_pin: str = Field(..., min_length=4, max_length=4, pattern=r"^\d{4}$")

class SecurityUpdate(BaseModel):
    security_name: Optional[str] = Field(None, min_length=1, max_length=255)
    security_pin: Optional[str] = Field(None, min_length=4, max_length=4, pattern=r"^\d{4}$")
    is_active: Optional[bool] = None

class SecurityResponse(BaseModel):
    security_id: int
    security_name: str
    security_pin: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
