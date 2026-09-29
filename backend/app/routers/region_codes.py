from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.region_code import RegionCode

router = APIRouter()


@router.get("/sido")
def get_sido_list(db: Session = Depends(get_db)):
    """전체 시/도 목록 (중복 제거)"""
    rows = db.query(RegionCode.sido).distinct().all()
    return sorted([r[0] for r in rows])


@router.get("/sigungu")
def get_sigungu_list(sido: str, db: Session = Depends(get_db)):
    """특정 시/도의 시/군/구 목록"""
    rows = db.query(RegionCode.sigungu).filter(RegionCode.sido == sido).distinct().all()
    return sorted([r[0] for r in rows])


@router.get("/codes")
def get_codes(sido: str, sigungu: str, db: Session = Depends(get_db)):
    """시/도 + 시/군/구로 area_cd, signgu_cd 조회"""
    row = db.query(RegionCode).filter(
        RegionCode.sido == sido,
        RegionCode.sigungu == sigungu
    ).first()
    if not row:
        return {"area_cd": None, "signgu_cd": None}
    return {"area_cd": row.area_cd, "signgu_cd": row.signgu_cd}