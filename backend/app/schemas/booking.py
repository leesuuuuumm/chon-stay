from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime


class BookingItemRequest(BaseModel):
    quantity: int = Field(ge=1, le=30)  # 숙박 항목은 박수를 의미한다
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
    coupon_id: Optional[int] = None


class BookingResponse(BaseModel):
    booking_id: int
    status: str
    total_price: int
    discount_amount: int = 0


class HostBookingItem(BaseModel):
    type: str  # "experience" | "lodging"
    title: str
    quantity: int
    unit_price: int
    subtotal: int


class MyBookingResponse(BaseModel):
    id: int
    status: str
    headcount: int
    start_date: date
    end_date: date
    total_price: int
    requested_at: datetime
    decided_at: Optional[datetime] = None
    village_id: int
    village_name: Optional[str] = None
    discount_amount: int = 0
    items: List[HostBookingItem]


class HostBookingResponse(BaseModel):
    id: int
    status: str
    headcount: int
    start_date: date
    end_date: date
    total_price: int
    requested_at: datetime
    decided_at: Optional[datetime] = None
    applicant_name: str
    discount_amount: int = 0
    items: List[HostBookingItem]