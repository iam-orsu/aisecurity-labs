from pydantic import BaseModel, EmailStr
from typing import Optional, List

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user_id: int
    user_name: str
    user_email: str

class UserProfile(BaseModel):
    name: str
    email: str
    salary: int
    leaves: int
    department: str
    role: str

class LeaveRequest(BaseModel):
    date: str
    reason: str

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class GenericMessage(BaseModel):
    message: str
