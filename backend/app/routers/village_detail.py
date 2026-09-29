from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.village import Village
from app.models.listing import Experience, Lodging
from app.models.region_code import RegionCode
from app.schemas.village_detail import VillageDetailResponse, VillageNearbyResponse
from app.core.tourapi import get_nearby_festivals, get_nearby_spots
from app.core.attractions import find_attractions

router = APIRouter()


def experience_key(e):
    return (e.title.strip(), e.start_date, e.end_date, e.price, e.capacity)


def lodging_key(l):
    return (l.title.strip(), l.unit.strip(), l.price, l.capacity)


def _unique(rows, key):
    seen = set()
    result = []
    for row in rows:
        k = key(row)
        if k not in seen:
            seen.add(k)
            result.append(row)
    return result


@router.get("/{village_id}/detail", response_model=VillageDetailResponse)
def get_village_detail(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village or not village.name:
        raise HTTPException(status_code=404, detail="마을을 찾을 수 없습니다")

    experiences = (
        db.query(Experience).filter(Experience.village_id == village_id).order_by(Experience.id).all()
    )
    lodgings = db.query(Lodging).filter(Lodging.village_id == village_id).order_by(Lodging.id).all()

    return VillageDetailResponse(
        id=village.id,
        name=village.name,
        description=village.description,
        image_path=village.image_path,
        experiences=_unique(
            experiences,
            experience_key,
        ),
        lodgings=_unique(
            lodgings,
            lodging_key,
        ),
    )


@router.get("/{village_id}/nearby", response_model=VillageNearbyResponse)
def get_village_nearby(village_id: int, db: Session = Depends(get_db)):
    """마을 인근 축제·관광지. 관광지는 TourAPI 실패 시 전국관광지정보표준데이터(CSV)로 대체."""
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village or not village.name:
        raise HTTPException(status_code=404, detail="마을을 찾을 수 없습니다")

    region = None
    if village.signgu_cd:
        region = db.query(RegionCode).filter(RegionCode.signgu_cd == village.signgu_cd).first()

    festivals = get_nearby_festivals(village.signgu_cd) or []
    spots = get_nearby_spots(village.signgu_cd)
    source = "tourapi"
    if not spots and region:
        spots = find_attractions(region.sido, region.sigungu)
        source = "csv"

    return VillageNearbyResponse(
        region=f"{region.sido} {region.sigungu}" if region else None,
        source=source,
        festivals=festivals,
        spots=spots or [],
    )
