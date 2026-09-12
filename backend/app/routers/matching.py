from fastapi import APIRouter

router = APIRouter()

# 체류 매칭 서비스: 관심사-마을 매칭 코스추천 + TourAPI(관광지·축제) 연계


@router.post("/recommend")
def recommend_stay():
    # TODO: 사용자 관심사 입력 -> 마을/빈집/밭체험 매칭 + TourAPI 관광지·축제 결합 코스
    return {"recommendations": []}


@router.get("/tour-spots")
def get_tour_spots(area_code: str | None = None):
    # TODO: 한국관광공사 TourAPI 연동하여 지역별 관광지/축제 조회
    return {"area_code": area_code, "spots": []}
