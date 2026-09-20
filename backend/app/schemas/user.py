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

    # 계정 만들기 까탈스러우니 우선 제한 해놓음
    # @field_validator("password")
    # @classmethod
    # def validate_password(cls, v):
    #     if len(v) < 8:
    #         raise ValueError("비밀번호는 최소 8자 이상이어야 합니다")
    #     if not re.search(r"[A-Za-z]", v):
    #         raise ValueError("비밀번호는 영문자를 포함해야 합니다")
    #     if not re.search(r"[0-9]", v):
    #         raise ValueError("비밀번호는 숫자를 포함해야 합니다")
    #     if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
    #         raise ValueError("비밀번호는 특수문자를 포함해야 합니다")    
    # return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("이름은 최소 2자 이상이어야 합니다")
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

