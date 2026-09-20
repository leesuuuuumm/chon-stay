from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class BookingItemRequest(BaseModel):
    quantity: int
    unit_price: int
    subtotal: int
    experience_id: Optional[int] = None
    lodging_id: Optional[int] = None


class BookingRequest(BaseModel):
    village_id: int
    headcount: int
    visit_date: date
    total_price: int
    items: List[BookingItemRequest]


class BookingResponse(BaseModel):
    booking_id: int
    status: str