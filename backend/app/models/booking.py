from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, func
from app.core.database import Base


class Booking(Base):
    __tablename__ = "booking"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), default="pending")
    headcount = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_price = Column(Integer, nullable=False)
    account_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    requested_at = Column(DateTime, server_default=func.now())
    decided_at = Column(DateTime, nullable=True)


class BookingItem(Base):
    __tablename__ = "booking_item"

    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)
    subtotal = Column(Integer, nullable=False)
    experience_id = Column(Integer, ForeignKey("experiences.id"), nullable=True)
    lodging_id = Column(Integer, ForeignKey("lodgings.id"), nullable=True)
    booking_id = Column(Integer, ForeignKey("booking.id"), nullable=False)
    start_date = Column(Date, nullable=True)  # 체험: 방문일, 숙박: 체크인
    end_date = Column(Date, nullable=True)  # 체험: 방문일, 숙박: 체크아웃