from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class LogResponse(BaseModel):
    id: int
    form_id: str
    qr_code_id: str
    qr_name: str
    gate_name: str
    campus_name: str
    security_name: Optional[str]
    form_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
