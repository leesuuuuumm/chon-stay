from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_approved_village
from app.core.uploads import save_photo
from datetime import timedelta

from app.core.coupons import today_kst
from app.models.booking import Booking, BookingItem
from app.models.listing import Experience, ExperienceImage, Lodging, LodgingImage
from app.models.village import Village
from app.schemas.listing import (
    ExperienceCreate,
    ExperienceResponse,
    ImageResponse,
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
    data = payload.model_dump(exclude = {"interests"})
    interest_code = {code.value for code in payload.interests}

    # 저장 도중 실패 후 재시도해도 같은 체험이 중복 등록되지 않도록, 동일한 항목이 있으면 그걸 돌려준다.
    experience = (
        db.query(Experience)
        .filter(Experience.village_id == village.id, *[getattr(Experience, k) == v for k, v in data.items()])
        .first()
    )
    if experience:
        merged = set(experience.interest_code or set()) | interest_code
        experience.interest_code = merged or None
    else:
        experience = Experience(village_id = village.id, interest_code = interest_code or None, **data)
        db.add(experience)
    db.commit()
    db.refresh(experience)
    return experience


@router.post("/experiences/{experience_id}/images", response_model = list[ImageResponse])
def upload_experience_images(
    experience_id: int,
    files: list[UploadFile] = File(...),
    cover_index: int = Form(0),
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    experience = (
        db.query(Experience)
        .filter(Experience.id == experience_id, Experience.village_id == village.id)
        .first()
    )
    if not experience:
        raise HTTPException(status_code = 404, detail = "체험을 찾을 수 없습니다.")

    has_existing_cover = any(image.is_cover for image in experience.images)
    images = []
    for i, file in enumerate(files):
        image_path = save_photo(file, "experiences")
        is_cover = not has_existing_cover and i == cover_index
        image = ExperienceImage(experience_id = experience.id, image_path = image_path, is_cover = is_cover)
        db.add(image)
        images.append(image)
    db.commit()
    for image in images:
        db.refresh(image)
    return images


@router.post("/lodgings", response_model = LodgingResponse)
def create_lodging(
    payload: LodgingCreate,
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    data = payload.model_dump()
    lodging = (
        db.query(Lodging)
        .filter(Lodging.village_id == village.id, *[getattr(Lodging, k) == v for k, v in data.items()])
        .first()
    )
    if not lodging:
        lodging = Lodging(village_id = village.id, **data)
        db.add(lodging)
        db.commit()
        db.refresh(lodging)
    return lodging


@router.post("/lodgings/{lodging_id}/images", response_model = list[ImageResponse])
def upload_lodging_images(
    lodging_id: int,
    files: list[UploadFile] = File(...),
    cover_index: int = Form(0),
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    lodging = (
        db.query(Lodging)
        .filter(Lodging.id == lodging_id, Lodging.village_id == village.id)
        .first()
    )
    if not lodging:
        raise HTTPException(status_code = 404, detail = "숙소를 찾을 수 없습니다.")

    has_existing_cover = any(image.is_cover for image in lodging.images)
    images = []
    for i, file in enumerate(files):
        image_path = save_photo(file, "lodgings")
        is_cover = not has_existing_cover and i == cover_index
        image = LodgingImage(lodging_id = lodging.id, image_path = image_path, is_cover = is_cover)
        db.add(image)
        images.append(image)
    db.commit()
    for image in images:
        db.refresh(image)
    return images


@router.get("/lodgings/{lodging_id}/unavailable-dates")
def get_lodging_unavailable_dates(lodging_id: int, db: Session = Depends(get_db)):
    """이미 예약된(대기/승인) 숙박의 '밤' 날짜 목록. 체크아웃 날짜는 비워지는 날이라 포함하지 않는다."""
    today = today_kst()
    rows = (
        db.query(BookingItem.start_date, BookingItem.end_date)
        .join(Booking, Booking.id == BookingItem.booking_id)
        .filter(
            BookingItem.lodging_id == lodging_id,
            Booking.status.in_(("pending", "approved")),
            BookingItem.start_date.isnot(None),
            BookingItem.end_date > today,
        )
        .all()
    )
    nights = set()
    for start, end in rows:
        day = start
        while day < end:
            nights.add(day)
            day += timedelta(days = 1)
    return {"dates": sorted(d.isoformat() for d in nights)}


@router.get("/mine", response_model = MyListingsResponse)
def get_my_listings(db: Session = Depends(get_db), village: Village = Depends(get_current_approved_village)):
    experiences = db.query(Experience).filter(Experience.village_id == village.id).all()
    lodgings = db.query(Lodging).filter(Lodging.village_id == village.id).all()
    return {"experiences": experiences, "lodgings": lodgings}
