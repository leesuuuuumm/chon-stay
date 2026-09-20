from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.core.database import Base
from app.models import booking  # noqa: F401  (review.booking_item_id FK 대상 테이블 등록)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key = True, index = True)
    # 예약 항목(체험 1건 / 숙박 1건)마다 리뷰는 한 번만 쓸 수 있다.
    booking_item_id = Column(Integer, ForeignKey("booking_item.id"), unique = True, nullable = False)
    account_id = Column(Integer, ForeignKey("users.id"), nullable = False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable = False)
    experience_id = Column(Integer, ForeignKey("experiences.id"), nullable = True, index = True)
    lodging_id = Column(Integer, ForeignKey("lodgings.id"), nullable = True, index = True)
    rating = Column(Integer, nullable = False)  # 1~5
    comment = Column(String(200), nullable = False)
    created_date = Column(DateTime, server_default = func.now())
