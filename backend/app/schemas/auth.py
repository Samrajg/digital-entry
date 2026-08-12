from pydantic import BaseModel, field_validator
from typing import Literal

# TODO: Before Production:
# - Validate PIN length/complexity once hashing is added.
# - Enforce stricter authorization controls.

class LoginRequest(BaseModel):
    username: str
    user_pin: str

class UserResponse(BaseModel):
    user_id: int
    username: str
    user_role: Literal["admin", "security", "supervisor", "manager"]

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    message: str
    user: UserResponse
