from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from app.core.validators import domain_has_mx_record

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

    @field_validator("email")
    @classmethod
    def validate_email_domain(cls, v):
        if not domain_has_mx_record(v):
            raise ValueError("존재하지 않은 이메일 도메인입니다.")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    is_admin: bool
    created_date: datetime

    class Config:
        from_attributes = True

