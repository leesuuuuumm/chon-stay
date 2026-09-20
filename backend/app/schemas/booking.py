from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime


class BookingItemRequest(BaseModel):
    quantity: int = Field(ge=1)  # 체험: 참여 인원, 숙박: 박수
    unit_price: int
    subtotal: int
    experience_id: Optional[int] = None
    lodging_id: Optional[int] = None
    check_in: Optional[date] = None  # 숙박 전용
    check_out: Optional[date] = None  # 숙박 전용


class BookingRequest(BaseModel):
    village_id: int
    headcount: int
    visit_date: Optional[date] = None  # 체험 방문 날짜 (체험이 있을 때 필수)
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
    start_date: Optional[date] = None
    end_date: Optional[date] = None


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