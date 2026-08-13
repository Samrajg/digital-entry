from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class FormFieldSchema(BaseModel):
    id: str
    type: str = Field(..., description="text, number, email, textarea, select")
    label: str
    required: bool = False
    options: Optional[List[str]] = None

class DynamicFormCreate(BaseModel):
    form_id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    schema_: List[FormFieldSchema] = Field(..., alias="schema")

    class Config:
        populate_by_name = True

class DynamicFormUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    schema_: Optional[List[FormFieldSchema]] = Field(None, alias="schema")
    is_active: Optional[bool] = None

    class Config:
        populate_by_name = True

class DynamicFormResponse(BaseModel):
    form_id: str
    name: str
    description: Optional[str]
    schema_: List[FormFieldSchema] = Field(..., alias="schema")
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class DynamicResponseSubmit(BaseModel):
    security_pin: str = Field(..., min_length=4, max_length=4)
    response_data: Dict[str, Any]

class DynamicResponseView(BaseModel):
    response_id: int
    form_id: str
    qr_code_id: str
    response_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
