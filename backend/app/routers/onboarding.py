from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.village import Village

from app.models.listing import Experience
from app.models.onboarding import Onboarding, OnboardingInterest, OnboardingList
from app.schemas.onboarding import OnboardingRequest, OnboardingResponse, VillageRecommendation


router = APIRouter()

INTEREST_LABEL_MAP = {
    "FARMING": "농사체험",
    "CRAFT": "공방·수공예",
    "HEALING": "휴양·힐링",
    "NATURE": "자연체험",
}

# 매칭 계산 어떻게 할지 생각해보기!!!!!(매칭추천 알고리즘!!) -> 자카드 알고리즘
def calculate_jaccard_score(user_interests: set, village_interests: set) -> int:
    #자카드 유사도: 교집합 크기 / 합집합 크기
    if not village_interests:
        return 0

    intersection = user_interests & village_interests
    union = user_interests | village_interests

    if not union:
        return 

    similarity  = len(intersection) / len(union)
    return round(similarity * 100)

@router.post("/recommend", response_model = OnboardingResponse)
def recommend_villages(
    req: OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    onboarding = Onboarding(duration_of_stay = req.duration, account_id = current_user.id)
    db.add(onboarding)
    db.commit()
    db.refresh(onboarding)

    for interest in req.interests:
        db.add(OnboardingInterest(interest_code = interest, onboarding_id = onboarding.id))
    db.commit()


    # 마을변 자카드 유사도 계산
    user_interests = set(req.interests)
    villages = db.query(Village).all()
    recommendations = []

    for village in villages:
        village_experiences = db.query(Experience).filter(Experience.village_id == village.id).all()
        village_interests = {e.interest_code.value for e in village_experiences if e.interest_code}
        matched = user_interests & village_interests
        if not matched:
            continue # 하나도 안 겹치면 추천 목록에서 제외

        score = calculate_jaccard_score(user_interests, village_interests)
        matched_label = INTEREST_LABEL_MAP.get(list(matched)[0], list(matched)[0])
        explanation = f"{matched_label} 원하시는군요"

        onboarding_list = OnboardingList(
            explanation = explanation,
            matching_score = score,
            alert = False,
            onboarding_id = onboarding.id,
            village_id = village.id,
        )
        db.add(onboarding_list)

        recommendations.append(
            VillageRecommendation(
                village_id=village.id,
                village_name=village.name,
                explanation=explanation,
                matching_score=score,
                alert=False,
            )
        )

    db.commit()
    recommendations.sort(key=lambda x: x.matching_score, reverse=True)

    return OnboardingResponse(onboarding_id=onboarding.id, recommendations=recommendations[:10])    

    


