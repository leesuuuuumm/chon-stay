from datetime import date
from pydantic import BaseModel
from typing import List


class ImageDetail(BaseModel):
    id: int
    image_path: str
    is_cover: bool

    class Config:
        from_attributes = True


class ExperienceDetail(BaseModel):
    id: int
    title: str
    season: str | None = None
    start_date: date
    end_date: date
    price: int
    capacity: int
    images: List[ImageDetail] = []

    class Config:
        from_attributes = True


class LodgingDetail(BaseModel):
    id: int
    title: str
    unit: str
    price: int
    capacity: int
    images: List[ImageDetail] = []

    class Config:
        from_attributes = True


class VillageDetailResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    image_path: str | None = None   # 추가
    experiences: List[ExperienceDetail]
    lodgings: List[LodgingDetail]