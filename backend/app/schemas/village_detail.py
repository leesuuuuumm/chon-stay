from datetime import date
from pydantic import BaseModel
from typing import List


class ExperienceDetail(BaseModel):
    id: int
    title: str
    season: str | None = None
    start_date: date
    end_date: date
    price: int
    capacity: int

    class Config:
        from_attributes = True


class LodgingDetail(BaseModel):
    id: int
    title: str
    unit: str
    price: int
    capacity: int

    class Config:
        from_attributes = True


class VillageDetailResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    image_path: str | None = None   # 추가
    experiences: List[ExperienceDetail]
    lodgings: List[LodgingDetail]