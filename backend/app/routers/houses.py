from fastapi import APIRouter

router = APIRouter()

# 빈집 체험 프로젝트: 농촌 빈집 데이터 연계, 단기 임대/체험형 숙박


@router.get("/")
def list_houses():
    # TODO: 빈집 목록 (지역/상태/체험 가능 여부)
    return {"houses": []}


@router.get("/{house_id}")
def get_house(house_id: int):
    # TODO: 빈집 상세 (밭 가꾸기 연계 여부 포함)
    return {"house_id": house_id}
