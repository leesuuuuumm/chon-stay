from pydantic import BaseModel
from typing import List


class ExperienceDetail(BaseModel):
    id: int
    title: str
    season: str | None = None
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
    experiences: List[ExperienceDetail]
    lodgings: List[LodgingDetail]