from sqlalchemy import Column, Integer, String
from app.core.database import Base


class RegionCode(Base):
    __tablename__ = "region_codes"

    id = Column(Integer, primary_key=True, index=True)
    sido = Column(String(20), nullable=False)
    sigungu = Column(String(20), nullable=False)
    area_cd = Column(String(2), nullable=False)
    signgu_cd = Column(String(5), nullable=False)