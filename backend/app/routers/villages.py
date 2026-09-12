from fastapi import APIRouter

router = APIRouter()

# 인구감소 심각도 시각화 및 우선추천, 이장(로컬 파트너) 정보 포함


@router.get("/")
def list_villages():
    # TODO: 지자체별 마을 목록 + 인구감소 지표
    return {"villages": []}


@router.get("/{village_id}")
def get_village(village_id: int):
    # TODO: 마을 상세 (인구지표, 연계 관광거점, 로컬 파트너)
    return {"village_id": village_id}


@router.get("/{village_id}/population-index")
def get_population_index(village_id: int):
    # TODO: 생활인구 감소 심각도 지표 계산/시각화용 데이터
    return {"village_id": village_id, "index": None}
