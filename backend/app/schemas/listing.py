from pydantic import BaseModel, Field, model_validator
from datetime import date, datetime

from app.models.enums import InterestCode


class ExperienceCreate(BaseModel):
    title: str
    start_date: date
    end_date: date
    price: int
    capacity: int
    interests: list[InterestCode] = []

    @model_validator(mode = "after")
    def check_date_range(self):
        if self.end_date < self.start_date:
            raise ValueError("종료일은 시작일보다 빠를 수 없습니다.")
        return self


class ImageResponse(BaseModel):
    id: int
    image_path: str
    is_cover: bool

    class Config:
        from_attributes = True


class ExperienceResponse(ExperienceCreate):
    id: int
    village_id: int
    created_date: datetime
    images: list[ImageResponse] = []
    interests: list[InterestCode] = Field(default_factory = list, validation_alias = "interest_codes")

    class Config:
        from_attributes = True


class LodgingCreate(BaseModel):
    title: str
    unit: str
    price: int
    capacity: int


class LodgingResponse(LodgingCreate):
    id: int
    village_id: int
    created_date: datetime
    images: list[ImageResponse] = []

    class Config:
        from_attributes = True


class MyListingsResponse(BaseModel):
    experiences: list[ExperienceResponse]
    lodgings: list[LodgingResponse]
