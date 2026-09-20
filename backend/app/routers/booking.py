from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_approved_village, get_current_user
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
    booking = Booking(
        status="pending",
        headcount=req.headcount,
        start_date=req.visit_date,
        end_date=req.visit_date,
        total_price=req.total_price,
        account_id=current_user.id,
        village_id=req.village_id,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    for item in req.items:
        db.add(BookingItem(
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
            experience_id=item.experience_id,
            lodging_id=item.lodging_id,
            booking_id=booking.id,
        ))
    db.commit()

    return BookingResponse(booking_id=booking.id, status=booking.status)


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


@router.get("/mine", response_model=list[MyBookingResponse])
def list_my_bookings(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    rows = (
        db.query(Booking, Village.name)
        .outerjoin(Village, Village.id == Booking.village_id)
        .filter(Booking.account_id == current_user.id)
        .order_by(Booking.requested_at.desc(), Booking.id.desc())
        .all()
    )
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
            items=items_by_booking[booking.id],
        )
        for booking, village_name in rows
    ]


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
