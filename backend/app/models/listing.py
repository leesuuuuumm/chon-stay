from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, func

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


class Lodging(Base):
    __tablename__ = "lodgings"

    id = Column(Integer, primary_key = True, index = True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable = False, index = True)
    title = Column(String(200), nullable = False)
    unit = Column(String(50), nullable = False)
    price = Column(Integer, nullable = False)
    capacity = Column(Integer, nullable = False)
    created_date = Column(DateTime, server_default = func.now())
