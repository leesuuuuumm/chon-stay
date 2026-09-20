from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.booking import Booking, BookingItem
from app.schemas.booking import BookingRequest, BookingResponse

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