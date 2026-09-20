import calendar
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingItem
from app.models.coupon import Coupon
from app.models.user import User

WELCOME_CODE = "WELCOME10"
WELCOME_TITLE = "가입 축하 10% 할인 쿠폰"
WELCOME_PERCENT = 10
WELCOME_VALID_MONTHS = 1

STAY_CODE_PREFIX = "STAY20-"
STAY_TITLE = "숙박 완료 20% 할인 쿠폰"
STAY_PERCENT = 20
STAY_VALID_MONTHS = 12

KST = timezone(timedelta(hours = 9))


def today_kst() -> date:
    # 예약 날짜(체크인/체크아웃)는 한국 날짜 기준이다.
    return datetime.now(KST).date()


def _utc_now() -> datetime:
    # DB의 now()가 UTC라서 같은 기준으로 비교한다.
    return datetime.now(timezone.utc).replace(tzinfo = None)


def _add_months(moment: datetime, months: int) -> datetime:
    index = moment.month - 1 + months
    year, month = moment.year + index // 12, index % 12 + 1
    day = min(moment.day, calendar.monthrange(year, month)[1])
    return moment.replace(year = year, month = month, day = day)


def coupon_status(coupon: Coupon) -> str:
    if coupon.status == "used":
        return "used"
    if coupon.expires_at < _utc_now():
        return "expired"
    return "available"


def ensure_welcome_coupon(db: Session, account_id: int) -> None:
    """가입 쿠폰을 한 번만 발급한다. 유효기간은 가입일로부터 한 달이며, 이미 지났으면 발급하지 않는다."""
    exists = (
        db.query(Coupon.id)
        .filter(Coupon.account_id == account_id, Coupon.code == WELCOME_CODE)
        .first()
    )
    if exists:
        return
    signed_up_at = db.query(User.created_date).filter(User.id == account_id).scalar() or _utc_now()
    expires_at = _add_months(signed_up_at, WELCOME_VALID_MONTHS)
    if expires_at < _utc_now():
        return
    db.add(
        Coupon(
            account_id = account_id,
            code = WELCOME_CODE,
            title = WELCOME_TITLE,
            discount_percent = WELCOME_PERCENT,
            expires_at = expires_at,
        )
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()  # 동시에 두 번 발급 요청이 들어온 경우


def ensure_stay_coupons(db: Session, account_id: int) -> None:
    """숙박이 포함된 '승인된' 예약의 체크아웃 날짜가 되면 예약 1건당 숙박 쿠폰 1장을 발급한다.

    취소/거절된 예약은 status가 approved가 아니므로 발급 대상이 아니다.
    """
    has_lodging = (
        db.query(BookingItem.id)
        .filter(BookingItem.booking_id == Booking.id, BookingItem.lodging_id.isnot(None))
        .exists()
    )
    due = (
        db.query(Booking.id, Booking.end_date)
        .filter(
            Booking.account_id == account_id,
            Booking.status == "approved",
            Booking.end_date > Booking.start_date,
            Booking.end_date <= today_kst(),
            has_lodging,
        )
        .all()
    )
    if not due:
        return
    issued = {
        code
        for (code,) in db.query(Coupon.code).filter(
            Coupon.account_id == account_id, Coupon.code.like(f"{STAY_CODE_PREFIX}%")
        )
    }
    for booking_id, end_date in due:
        code = f"{STAY_CODE_PREFIX}{booking_id}"
        if code in issued:
            continue
        db.add(
            Coupon(
                account_id = account_id,
                code = code,
                title = STAY_TITLE,
                discount_percent = STAY_PERCENT,
                applies_to = "lodging",
                expires_at = _add_months(datetime.combine(end_date, time(23, 59, 59)), STAY_VALID_MONTHS),
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
