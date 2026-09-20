from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.village import Village
from app.models.listing import Experience, Lodging
from app.schemas.village_detail import VillageDetailResponse

router = APIRouter()


@router.get("/{village_id}/detail", response_model=VillageDetailResponse)
def get_village_detail(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village or not village.name:
        raise HTTPException(status_code=404, detail="마을을 찾을 수 없습니다")

    experiences = db.query(Experience).filter(Experience.village_id == village_id).all()
    lodgings = db.query(Lodging).filter(Lodging.village_id == village_id).all()

    return VillageDetailResponse(
        id=village.id,
        name=village.name,
        description=village.description,
        image_path=village.image_path,  
        experiences=experiences,
        lodgings=lodgings,
    )