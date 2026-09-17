from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_approved_village
from app.models.listing import Experience, Lodging
from app.models.village import Village
from app.schemas.listing import (
    ExperienceCreate,
    ExperienceResponse,
    LodgingCreate,
    LodgingResponse,
    MyListingsResponse,
)

router = APIRouter()


@router.post("/experiences", response_model = ExperienceResponse)
def create_experience(
    payload: ExperienceCreate,
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    experience = Experience(village_id = village.id, **payload.model_dump())
    db.add(experience)
    db.commit()
    db.refresh(experience)
    return experience


@router.post("/lodgings", response_model = LodgingResponse)
def create_lodging(
    payload: LodgingCreate,
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    lodging = Lodging(village_id = village.id, **payload.model_dump())
    db.add(lodging)
    db.commit()
    db.refresh(lodging)
    return lodging


@router.get("/mine", response_model = MyListingsResponse)
def get_my_listings(db: Session = Depends(get_db), village: Village = Depends(get_current_approved_village)):
    experiences = db.query(Experience).filter(Experience.village_id == village.id).all()
    lodgings = db.query(Lodging).filter(Lodging.village_id == village.id).all()
    return {"experiences": experiences, "lodgings": lodgings}
