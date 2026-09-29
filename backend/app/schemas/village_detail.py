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


class NearbyFestival(BaseModel):
    content_id: str
    title: str
    start_date: str  # YYYYMMDD
    end_date: str    # YYYYMMDD
    address: str | None = None
    image_url: str | None = None


class NearbySpot(BaseModel):
    content_id: str | None = None   # TourAPI 콘텐츠 ID (CSV 폴백일 땐 없음)
    title: str
    category: str | None = None
    description: str | None = None
    address: str | None = None
    image_url: str | None = None


class VillageNearbyResponse(BaseModel):
    region: str | None = None   # "충청남도 부여군"
    source: str                 # "tourapi" | "csv" — 관광지 데이터 출처
    festivals: List[NearbyFestival]
    spots: List[NearbySpot]
