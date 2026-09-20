from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.village import Village
from app.models.listing import Experience, Lodging
from app.schemas.village_detail import VillageDetailResponse

router = APIRouter()


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
        experiences=_unique(
            experiences,
            lambda e: (e.title.strip(), e.start_date, e.end_date, e.price, e.capacity),
        ),
        lodgings=_unique(
            lodgings,
            lambda l: (l.title.strip(), l.unit.strip(), l.price, l.capacity),
        ),
    )
