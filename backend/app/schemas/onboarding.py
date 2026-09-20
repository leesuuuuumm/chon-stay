from pydantic import BaseModel
from typing import List
from app.models.enums import DurationOfStay, InterestCode

class OnboardingRequest(BaseModel):
    Interests: List[InterestCode]
    duration: DurationOfStay

class VillageRecommendation(BaseModel):
    village_id: int
    village_name: str
    explanation: str
    matching_score: int
    alert: bool

class OnboardingResponse(BaseModel):
    onboarding_ind: int
    recommenations: List[VillageRecommendation]