from pydantic import BaseModel, field_validator
from typing import List
from app.models.enums import DurationOfStay, InterestCode

INTEREST_KOREAN_MAP = {
    "농사체험": InterestCode.FARMING,
    "공방·수공예": InterestCode.CRAFT,
    "휴양·힐링": InterestCode.HEALING,
    "자연체험": InterestCode.NATURE,
}

DURATION_KOREAN_MAP = {
    "당일": DurationOfStay.DAY,
    "1박2일": DurationOfStay.ONE_NIGHT_TWO_DAYS,
    "한달살이": DurationOfStay.MONTH,
}

class OnboardingRequest(BaseModel):
    interests: List[str]
    duration: str

    @field_validator("interests")
    @classmethod
    def convert_interests(cls, v):
        return [
            INTEREST_KOREAN_MAP[i].value if i in INTEREST_KOREAN_MAP else i
            for i in v
        ]

    @field_validator("duration")
    @classmethod
    def convert_duration(cls, v):
        return DURATION_KOREAN_MAP[v].value if v in DURATION_KOREAN_MAP else v

class VillageRecommendation(BaseModel):
    village_id: int
    village_name: str
    explanation: str
    matching_score: int
    alert: bool

class OnboardingResponse(BaseModel):
    onboarding_id: int
    recommendations: List[VillageRecommendation]