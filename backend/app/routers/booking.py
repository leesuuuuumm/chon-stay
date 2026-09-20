from collections import defaultdict
from datetime import timedelta
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
from app.schemas.booking import (
    BookingRequest,
    BookingResponse,
    HostBookingItem,
    HostBookingResponse,
    MyBookingResponse,
)

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
    subtotal = sum(item.subtotal for item in req.items)
    # 숙박은 항목의 수량이 박수이고, 체크아웃 날짜 = 체크인(방문일) + 박수
    nights = max((item.quantity for item in req.items if item.lodging_id is not None), default=0)
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
        headcount=req.headcount,
        start_date=req.visit_date,
        end_date=req.visit_date + timedelta(days=nights),
        total_price=subtotal - discount,
        account_id=current_user.id,
        village_id=req.village_id,
    )
    db.add(booking)
    db.flush()

    for item in req.items:
        db.add(BookingItem(
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
            experience_id=item.experience_id,
            lodging_id=item.lodging_id,
            booking_id=booking.id,
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


def _load_items(db: Session, booking_ids: list[int]) -> dict[int, list[HostBookingItem]]:
    items_by_booking = defaultdict(list)
    if not booking_ids:
        return items_by_booking
    item_rows = (
        db.query(BookingItem, Experience.title, Lodging.title)
        .outerjoin(Experience, Experience.id == BookingItem.experience_id)
        .outerjoin(Lodging, Lodging.id == BookingItem.lodging_id)
        .filter(BookingItem.booking_id.in_(booking_ids))
        .order_by(BookingItem.id)
        .all()
    )
    for item, experience_title, lodging_title in item_rows:
        is_experience = item.experience_id is not None
        items_by_booking[item.booking_id].append(
            HostBookingItem(
                type="experience" if is_experience else "lodging",
                title=(experience_title if is_experience else lodging_title) or "삭제된 항목",
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal,
            )
        )
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
    items_by_booking = _load_items(db, [booking.id for booking, _ in rows])
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
