from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    full_name: str
    ambulance_id: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    ambulance_id: Optional[str] = "AMB-01"

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "DRIVER"

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str

    class Config:
        from_attributes = True
