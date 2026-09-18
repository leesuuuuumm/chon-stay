from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Date, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key = True, index = True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable = False, index = True)
    title = Column(String(200), nullable = False)
    start_date = Column(Date, nullable = False)
    end_date = Column(Date, nullable = False)
    price = Column(Integer, nullable = False)
    capacity = Column(Integer, nullable = False)
    created_date = Column(DateTime, server_default = func.now())

    images = relationship(
        "ExperienceImage", cascade = "all, delete-orphan", order_by = "ExperienceImage.id"
    )


class Lodging(Base):
    __tablename__ = "lodgings"

    id = Column(Integer, primary_key = True, index = True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable = False, index = True)
    title = Column(String(200), nullable = False)
    unit = Column(String(50), nullable = False)
    price = Column(Integer, nullable = False)
    capacity = Column(Integer, nullable = False)
    created_date = Column(DateTime, server_default = func.now())

    images = relationship(
        "LodgingImage", cascade = "all, delete-orphan", order_by = "LodgingImage.id"
    )


class ExperienceImage(Base):
    __tablename__ = "experience_images"

    id = Column(Integer, primary_key = True, index = True)
    experience_id = Column(Integer, ForeignKey("experiences.id"), nullable = False, index = True)
    image_path = Column(String(500), nullable = False)  # 공개 서빙 경로 (/media/...)
    is_cover = Column(Boolean, nullable = False, server_default = "0")  # 목록에서 보여줄 대표 이미지 여부
    created_date = Column(DateTime, server_default = func.now())


class LodgingImage(Base):
    __tablename__ = "lodging_images"

    id = Column(Integer, primary_key = True, index = True)
    lodging_id = Column(Integer, ForeignKey("lodgings.id"), nullable = False, index = True)
    image_path = Column(String(500), nullable = False)  # 공개 서빙 경로 (/media/...)
    is_cover = Column(Boolean, nullable = False, server_default = "0")  # 목록에서 보여줄 대표 이미지 여부
    created_date = Column(DateTime, server_default = func.now())
