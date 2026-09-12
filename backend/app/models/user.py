from sqlalchemy import Column, Integer, String, Boolean

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    is_village_leader = Column(Boolean, default=False)  # 이장(로컬 파트너) 여부
    hashed_password = Column(String(255), nullable=False)
