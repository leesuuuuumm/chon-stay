from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.village import Village

from app.models.listing import Experience
from app.models.onboarding import Onboarding, OnboardingInterest, OnboardingList
from app.schemas.onboarding import OnboardingRequest, OnboardingResponse, VillageRecommendation
from app.core.tourapi import get_decline_score


router = APIRouter()

INTEREST_LABEL_MAP = {
    "FARMING": "농사체험",
    "CRAFT": "공방·수공예",
    "HEALING": "휴양·힐링",
    "NATURE": "자연체험",
}


def calculate_jaccard_score(user_interests: set, village_interests: set) -> int:
    if not village_interests:
        return 0

    intersection = user_interests & village_interests
    union = user_interests | village_interests

    if not union:
        return 0

    similarity = len(intersection) / len(union)
    return round(similarity * 100)


@router.post("/recommend", response_model=OnboardingResponse)
def recommend_villages(
    req: OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    onboarding = Onboarding(duration_of_stay=req.duration, account_id=current_user.id)
    db.add(onboarding)
    db.commit()
    db.refresh(onboarding)

    for interest in req.interests:
        db.add(OnboardingInterest(interest_code=interest, onboarding_id=onboarding.id))
    db.commit()

    user_interests = set(req.interests)
    villages = db.query(Village).filter(
        Village.status == "approved",
        Village.name.isnot(None)
    ).all()
    recommendations = []

    for village in villages:
        village_experiences = db.query(Experience).filter(Experience.village_id == village.id).all()
        village_interests = {code.value for e in village_experiences for code in e.interest_codes}
        matched = user_interests & village_interests
        if not matched:
            continue

        score = calculate_jaccard_score(user_interests, village_interests)
        matched_label = INTEREST_LABEL_MAP.get(list(matched)[0], list(matched)[0])
        explanation = f"{matched_label} 원하시는군요"
        decline_score = get_decline_score(village.area_cd, village.signgu_cd)
        alert = decline_score >= 60

        onboarding_list = OnboardingList(
            explanation=explanation,
            matching_score=score,
            alert=alert,
            onboarding_id=onboarding.id,
            village_id=village.id,
        )
        db.add(onboarding_list)

        recommendations.append(
            VillageRecommendation(
                village_id=village.id,
                village_name=village.name,
                explanation=explanation,
                matching_score=score,
                alert=alert,
                decline_score=int(decline_score),
                image_path=village.image_path,
            )
        )

    db.commit()
    recommendations.sort(key=lambda x: (-x.decline_score, -x.matching_score))

    return OnboardingResponse(onboarding_id=onboarding.id, recommendations=recommendations[:10])