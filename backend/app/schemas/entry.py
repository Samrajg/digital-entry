from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


# BUG-02 FIX: Schema now matches the flat dict returned by EntryService.get_public_context().
# Old schema had `message: str` and `context: Dict[str, Any]` which caused 422 errors on every QR scan.
class PublicContextResponse(BaseModel):
    campusName: str
    gateName: str
    active: bool
    form_id: Optional[str] = None
    form_name: Optional[str] = None
    form_schema: Optional[Any] = None
    qr_type: str


# BUG-03 FIX: Schema now has pass_id and security_pin (the fields the endpoint actually uses).
# Old schema only had `pin: str` which caused AttributeError on every checkout call.
class CheckoutSubmit(BaseModel):
    pass_id: int
    security_pin: str


# BUG-06 FIX: Response schema now exposes all fields the service actually returns.
class CheckoutResponse(BaseModel):
    message: str
    pass_id: Optional[int] = None
    checked_out_at: Optional[datetime] = None
    visit_duration_minutes: Optional[int] = None
    campus_name: Optional[str] = None
    gate_name: Optional[str] = None
