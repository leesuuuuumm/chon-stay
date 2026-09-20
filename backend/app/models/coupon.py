from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func

from app.core.database import Base
from app.models import booking  # noqa: F401  (coupon.used_booking_id FK 대상 테이블 등록)


class Coupon(Base):
    __tablename__ = "coupon"
    __table_args__ = (UniqueConstraint("account_id", "code", name = "uq_coupon_account_code"),)

    id = Column(Integer, primary_key = True, index = True)
    account_id = Column(Integer, ForeignKey("users.id"), nullable = False, index = True)
    code = Column(String(30), nullable = False)
    title = Column(String(100), nullable = False)
    discount_percent = Column(Integer, nullable = False)
    applies_to = Column(String(20), nullable = False, default = "all", server_default = "all")  # all | lodging
    status = Column(String(20), nullable = False, default = "available")  # available | used
    issued_at = Column(DateTime, server_default = func.now())
    expires_at = Column(DateTime, nullable = False)
    used_at = Column(DateTime, nullable = True)
    used_booking_id = Column(Integer, ForeignKey("booking.id"), nullable = True)
    discount_amount = Column(Integer, nullable = True)
