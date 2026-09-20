from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.coupons import coupon_status, today_kst
from app.core.database import get_db
from app.core.deps import get_current_approved_village, get_current_user
from app.models.coupon import Coupon
from app.models.user import User
from app.models.village import Village
from app.models.listing import Experience, Lodging
from app.models.booking import Booking, BookingItem
from app.models.review import Review
from app.core.reviews import is_review_open
from app.schemas.booking import (
    BookingRequest,
    BookingResponse,
    HostBookingItem,
    HostBookingResponse,
    MyBookingItem,
    MyBookingResponse,
)
from app.schemas.review import MyReview

router = APIRouter()


@router.post("/", response_model=BookingResponse)
def create_booking(
    req: BookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for item in req.items:
        if item.subtotal != item.unit_price * item.quantity:
            raise HTTPException(status_code=400, detail="예약 항목 금액이 올바르지 않습니다.")
    today = today_kst()
    has_experience = any(item.experience_id is not None for item in req.items)
    if has_experience:
        if req.visit_date is None:
            raise HTTPException(status_code=400, detail="체험 방문 날짜를 선택해주세요.")
        if req.visit_date < today:
            raise HTTPException(status_code=400, detail="지난 날짜는 선택할 수 없어요.")
    # 숙박: 체크인/체크아웃 날짜로 박수를 정하고, 이미 예약된 날짜와 겹치면 예약할 수 없다.
    for item in req.items:
        if item.lodging_id is None:
            continue
        if item.check_in is None or item.check_out is None:
            raise HTTPException(status_code=400, detail="숙박 체크인/체크아웃 날짜를 선택해주세요.")
        nights = (item.check_out - item.check_in).days
        if nights < 1:
            raise HTTPException(status_code=400, detail="체크아웃은 체크인 다음 날부터 선택할 수 있어요.")
        if nights > 30:
            raise HTTPException(status_code=400, detail="숙박은 최대 30박까지 예약할 수 있어요.")
        if item.check_in < today:
            raise HTTPException(status_code=400, detail="지난 날짜는 선택할 수 없어요.")
        if item.quantity != nights:
            raise HTTPException(status_code=400, detail="숙박 박수가 선택한 날짜와 맞지 않아요.")
        # 같은 숙소에 대한 동시 예약을 순서대로 처리하기 위해 숙소 행을 잠근다.
        db.query(Lodging.id).filter(Lodging.id == item.lodging_id).with_for_update().first()
        if _lodging_has_conflict(db, item.lodging_id, item.check_in, item.check_out):
            raise HTTPException(status_code=409, detail="선택한 날짜에는 이미 예약된 숙소예요.")
    # 체험 항목의 수량은 참여 인원이며, 정원을 넘을 수 없다.
    experience_ids = [item.experience_id for item in req.items if item.experience_id is not None]
    if experience_ids:
        capacities = dict(
            db.query(Experience.id, Experience.capacity).filter(Experience.id.in_(experience_ids)).all()
        )
        for item in req.items:
            capacity = capacities.get(item.experience_id) if item.experience_id is not None else None
            if capacity is not None and item.quantity > capacity:
                raise HTTPException(status_code=400, detail=f"체험 정원({capacity}명)을 초과했어요.")

    subtotal = sum(item.subtotal for item in req.items)
    # 항목별 날짜: 체험은 방문일, 숙박은 체크인/체크아웃
    item_dates = [
        (item.check_in, item.check_out) if item.lodging_id is not None else (req.visit_date, req.visit_date)
        for item in req.items
    ]
    starts = [start for start, _ in item_dates if start is not None]
    ends = [end for _, end in item_dates if end is not None]
    # 예약 인원 = 체험 참여 인원 중 가장 큰 값 (체험 없이 숙박만 예약하면 1)
    headcount = max((item.quantity for item in req.items if item.experience_id is not None), default=1)
    coupon = None
    discount = 0
    if req.coupon_id is not None:
        coupon = (
            db.query(Coupon)
            .filter(Coupon.id == req.coupon_id, Coupon.account_id == current_user.id)
            .with_for_update()
            .first()
        )
        if not coupon or coupon_status(coupon) != "available":
            raise HTTPException(status_code=400, detail="사용할 수 없는 쿠폰입니다.")
        if coupon.applies_to == "lodging":
            discount_base = sum(item.subtotal for item in req.items if item.lodging_id is not None)
            if discount_base == 0:
                raise HTTPException(status_code=400, detail="숙박 예약에만 사용할 수 있는 쿠폰입니다.")
        else:
            discount_base = subtotal
        discount = discount_base * coupon.discount_percent // 100

    booking = Booking(
        status="pending",
        headcount=headcount,
        start_date=min(starts) if starts else today,
        end_date=max(ends) if ends else today,
        total_price=subtotal - discount,
        account_id=current_user.id,
        village_id=req.village_id,
    )
    db.add(booking)
    db.flush()

    for item, (start, end) in zip(req.items, item_dates):
        db.add(BookingItem(
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
            experience_id=item.experience_id,
            lodging_id=item.lodging_id,
            booking_id=booking.id,
            start_date=start,
            end_date=end,
        ))
    if coupon:
        coupon.status = "used"
        coupon.used_at = func.now()
        coupon.used_booking_id = booking.id
        coupon.discount_amount = discount
    db.commit()
    db.refresh(booking)

    return BookingResponse(
        booking_id=booking.id,
        status=booking.status,
        total_price=booking.total_price,
        discount_amount=discount,
    )


def _discount_of(booking: Booking, items: list[HostBookingItem]) -> int:
    # 결제 금액은 (항목 합계 - 쿠폰 할인)으로 저장되므로 차이가 곧 할인액이다.
    return max(0, sum(item.subtotal for item in items) - booking.total_price)


def _lodging_has_conflict(db: Session, lodging_id: int, check_in, check_out) -> bool:
    # 체크아웃 날짜는 비워지는 날이라, [체크인, 체크아웃) 구간이 겹칠 때만 충돌이다.
    return (
        db.query(BookingItem.id)
        .join(Booking, Booking.id == BookingItem.booking_id)
        .filter(
            BookingItem.lodging_id == lodging_id,
            Booking.status.in_(("pending", "approved")),
            BookingItem.start_date < check_out,
            BookingItem.end_date > check_in,
        )
        .first()
        is not None
    )


def _load_items(db: Session, booking_ids: list[int], with_reviews: bool = False) -> dict[int, list]:
    items_by_booking = defaultdict(list)
    if not booking_ids:
        return items_by_booking
    item_rows = (
        db.query(BookingItem, Experience.title, Lodging.title, Booking.status)
        .join(Booking, Booking.id == BookingItem.booking_id)
        .outerjoin(Experience, Experience.id == BookingItem.experience_id)
        .outerjoin(Lodging, Lodging.id == BookingItem.lodging_id)
        .filter(BookingItem.booking_id.in_(booking_ids))
        .order_by(BookingItem.id)
        .all()
    )
    reviews = {}
    if with_reviews:
        reviews = {
            review.booking_item_id: review
            for review in db.query(Review).filter(
                Review.booking_item_id.in_([item.id for item, *_ in item_rows])
            )
        }
    today = today_kst()
    for item, experience_title, lodging_title, booking_status in item_rows:
        is_experience = item.experience_id is not None
        fields = dict(
            type="experience" if is_experience else "lodging",
            title=(experience_title if is_experience else lodging_title) or "삭제된 항목",
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
            start_date=item.start_date,
            end_date=item.end_date,
        )
        if with_reviews:
            review = reviews.get(item.id)
            items_by_booking[item.booking_id].append(
                MyBookingItem(
                    **fields,
                    id=item.id,
                    can_review=review is None
                    and booking_status == "approved"
                    and is_review_open(item, today),
                    review=MyReview(
                        id=review.id,
                        rating=review.rating,
                        comment=review.comment,
                        created_date=review.created_date,
                    )
                    if review
                    else None,
                )
            )
        else:
            items_by_booking[item.booking_id].append(HostBookingItem(**fields))
    return items_by_booking


def _load_my_bookings(db: Session, account_id: int, booking_id: Optional[int] = None) -> list[MyBookingResponse]:
    query = (
        db.query(Booking, Village.name)
        .outerjoin(Village, Village.id == Booking.village_id)
        .filter(Booking.account_id == account_id)
    )
    if booking_id is not None:
        query = query.filter(Booking.id == booking_id)
    rows = query.order_by(Booking.requested_at.desc(), Booking.id.desc()).all()
    items_by_booking = _load_items(db, [booking.id for booking, _ in rows], with_reviews=True)
    return [
        MyBookingResponse(
            id=booking.id,
            status=booking.status,
            headcount=booking.headcount,
            start_date=booking.start_date,
            end_date=booking.end_date,
            total_price=booking.total_price,
            requested_at=booking.requested_at,
            decided_at=booking.decided_at,
            village_id=booking.village_id,
            village_name=village_name,
            discount_amount=_discount_of(booking, items_by_booking[booking.id]),
            items=items_by_booking[booking.id],
        )
        for booking, village_name in rows
    ]


@router.get("/mine", response_model=list[MyBookingResponse])
def list_my_bookings(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return _load_my_bookings(db, current_user.id)


def _release_coupon(db: Session, booking_id: int) -> None:
    # 거절/취소된 예약에 쓰인 쿠폰은 다시 사용할 수 있게 돌려준다.
    used_coupon = db.query(Coupon).filter(Coupon.used_booking_id == booking_id).first()
    if used_coupon:
        used_coupon.status = "available"
        used_coupon.used_at = None
        used_coupon.used_booking_id = None
        used_coupon.discount_amount = None


@router.post("/{booking_id}/cancel", response_model=MyBookingResponse)
def cancel_my_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.account_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")
    if booking.status not in ("pending", "approved"):
        raise HTTPException(status_code=400, detail="취소할 수 없는 예약입니다.")
    # 체크인 날짜가 되면(숙박이 시작되면) 취소할 수 없다.
    if today_kst() >= booking.start_date:
        raise HTTPException(status_code=400, detail="체크인 날짜가 된 예약은 취소할 수 없습니다.")

    booking.status = "cancelled"
    _release_coupon(db, booking.id)
    db.commit()
    return _load_my_bookings(db, current_user.id, booking_id)[0]


def _load_host_bookings(db: Session, village_id: int, booking_id: Optional[int] = None) -> list[HostBookingResponse]:
    query = (
        db.query(Booking, User.username)
        .join(User, User.id == Booking.account_id)
        .filter(Booking.village_id == village_id)
    )
    if booking_id is not None:
        query = query.filter(Booking.id == booking_id)
    rows = query.order_by(Booking.requested_at.desc(), Booking.id.desc()).all()
    items_by_booking = _load_items(db, [booking.id for booking, _ in rows])

    return [
        HostBookingResponse(
            id=booking.id,
            status=booking.status,
            headcount=booking.headcount,
            start_date=booking.start_date,
            end_date=booking.end_date,
            total_price=booking.total_price,
            requested_at=booking.requested_at,
            decided_at=booking.decided_at,
            applicant_name=username,
            discount_amount=_discount_of(booking, items_by_booking[booking.id]),
            items=items_by_booking[booking.id],
        )
        for booking, username in rows
    ]


@router.get("/host", response_model=list[HostBookingResponse])
def list_host_bookings(
    db: Session = Depends(get_db), village: Village = Depends(get_current_approved_village)
):
    return _load_host_bookings(db, village.id)


def _decide_booking(db: Session, village: Village, booking_id: int, new_status: str) -> HostBookingResponse:
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.village_id == village.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")
    if booking.status != "pending":
        raise HTTPException(status_code=400, detail="이미 처리된 예약입니다.")

    booking.status = new_status
    booking.decided_at = func.now()
    if new_status == "rejected":
        _release_coupon(db, booking.id)
    db.commit()
    return _load_host_bookings(db, village.id, booking_id)[0]


@router.post("/host/{booking_id}/approve", response_model=HostBookingResponse)
def approve_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    return _decide_booking(db, village, booking_id, "approved")


@router.post("/host/{booking_id}/reject", response_model=HostBookingResponse)
def reject_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    village: Village = Depends(get_current_approved_village),
):
    return _decide_booking(db, village, booking_id, "rejected")
