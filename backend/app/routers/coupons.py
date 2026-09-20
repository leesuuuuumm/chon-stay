from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.coupons import coupon_status, ensure_stay_coupons, ensure_welcome_coupon
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.coupon import Coupon
from app.models.user import User
from app.schemas.coupon import CouponResponse

router = APIRouter()

_STATUS_ORDER = {"available": 0, "used": 1, "expired": 2}


@router.get("/mine", response_model = list[CouponResponse])
def list_my_coupons(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 쿠폰 기능 도입 전에 가입한 계정도 처음 조회할 때 가입 쿠폰을 받는다.
    ensure_welcome_coupon(db, current_user.id)
    ensure_stay_coupons(db, current_user.id)
    coupons = db.query(Coupon).filter(Coupon.account_id == current_user.id).all()
    responses = [
        CouponResponse(
            id = c.id,
            code = c.code,
            title = c.title,
            discount_percent = c.discount_percent,
            applies_to = c.applies_to,
            status = coupon_status(c),
            issued_at = c.issued_at,
            expires_at = c.expires_at,
            used_at = c.used_at,
        )
        for c in coupons
    ]
    visible = [c for c in responses if c.status != "expired"]  # 기간이 지난 쿠폰은 보여주지 않는다
    return sorted(visible, key = lambda c: (_STATUS_ORDER[c.status], c.expires_at))
