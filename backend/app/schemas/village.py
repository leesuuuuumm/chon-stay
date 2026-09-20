from pydantic import BaseModel, EmailStr
from datetime import datetime


class VillageProfileUpdate(BaseModel):
    name: str
    description: str


class VillageResponse(BaseModel):
    id: int
    representative_name: str
    phone: str
    email: EmailStr
    registration_number: str
    document_path: str
    status: str
    name: str | None
    description: str | None
    image_path: str | None
    created_date: datetime

    class Config:
        from_attributes = True
