import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_admin_user, get_current_approved_village, get_current_user
from app.core.uploads import save_photo
from app.models.user import User
from app.models.village import Village
from app.schemas.village import VillageProfileUpdate, VillageResponse

router = APIRouter()

# 인구감소 심각도 시각화 및 우선추천, 이장(로컬 파트너) 정보 포함

ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


@router.post("/signup", response_model = VillageResponse)
def signup_village(
    representative_name: str = Form(...),
    phone: str = Form(...),
    registration_number: str = Form(...),
    document: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (registration_number.isdigit() and len(registration_number) == 10):
        raise HTTPException(status_code = 400, detail = "사업자 등록번호는 숫자 10자리여야 합니다.")

    phone = "".join(ch for ch in phone if ch.isdigit())
    if not (phone.startswith("010") and len(phone) == 11):
        raise HTTPException(status_code = 400, detail = "연락처는 010-1234-5678 형식이어야 합니다.")

    if db.query(Village).filter(Village.user_id == current_user.id).first():
        raise HTTPException(status_code = 400, detail = "이미 마을 대표자 신청을 하셨습니다.")

    ext = os.path.splitext(document.filename or "")[1].lower()
    if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise HTTPException(status_code = 400, detail = "지원하지 않는 파일 형식입니다. (pdf/jpg/jpeg/png)")

    os.makedirs(settings.UPLOAD_DIR, exist_ok = True)
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    with open(stored_path, "wb") as out_file:
        out_file.write(document.file.read())

    village = Village(
        user_id = current_user.id,
        representative_name = representative_name,
        phone = phone,
        registration_number = registration_number,
        document_path = stored_path,
        status = "pending",
    )
    db.add(village)
    db.commit()
    db.refresh(village)
    return village


@router.get("/my-application", response_model = VillageResponse)
def get_my_village_application(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    village = db.query(Village).filter(Village.user_id == current_user.id).first()
    if not village:
        raise HTTPException(status_code = 404, detail = "마을 대표자 신청 내역이 없습니다.")
    return village


@router.patch("/me", response_model = VillageResponse)
def update_my_village_profile(
    payload: VillageProfileUpdate,
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    village.name = payload.name
    village.description = payload.description
    db.commit()
    db.refresh(village)
    return village


@router.post("/me/photo", response_model = VillageResponse)
def upload_my_village_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    village.image_path = save_photo(photo, "villages")
    db.commit()
    db.refresh(village)
    return village


@router.get("/", response_model = list[VillageResponse])
def list_villages(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    return db.query(Village).order_by(Village.created_date.desc()).all()


@router.get("/{village_id}", response_model = VillageResponse)
def get_village(village_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code = 404, detail = "마을을 찾을 수 없습니다.")
    return village


@router.get("/{village_id}/document")
def get_village_document(
    village_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)
):
    # admin이 업로드된 인증 서류 원본을 확인할 때 사용
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code = 404, detail = "마을을 찾을 수 없습니다.")
    if not os.path.exists(village.document_path):
        raise HTTPException(status_code = 404, detail = "서류 파일을 찾을 수 없습니다.")
    return FileResponse(village.document_path)


@router.post("/{village_id}/approve", response_model = VillageResponse)
def approve_village(village_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code = 404, detail = "마을을 찾을 수 없습니다.")

    village.status = "approved"
    db.commit()
    db.refresh(village)
    return village


@router.post("/{village_id}/reject", response_model = VillageResponse)
def reject_village(village_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code = 404, detail = "마을을 찾을 수 없습니다.")

    village.status = "rejected"
    db.commit()
    db.refresh(village)
    return village


@router.get("/{village_id}/population-index")
def get_population_index(village_id: int):
    # TODO: 생활인구 감소 심각도 지표 계산/시각화용 데이터
    return {"village_id": village_id, "index": None}


#