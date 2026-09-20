from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, func
from app.core.database import Base
from app.models.enums import InterestCode


class Experience(Base):
    __tablename__ = "experience"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    season = Column(String(50))
    capacity = Column(Integer)
    price = Column(Integer)
    description = Column(String(500))
    interest_code = Column(Enum(InterestCode), nullable=False)  # erd에 없어서 따로 추가함 농사체험, 공방-수공예, 휴양-힐링, 자연체험
    create_date = Column(DateTime, server_default=func.now())
    update_date = Column(DateTime, server_default=func.now(), onupdate=func.now())
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
