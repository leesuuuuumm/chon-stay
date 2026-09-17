from sqlalchemy import Column, Integer, String, Boolean, DateTime, func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key = True, index = True)
    email = Column(String(255), unique = True, index = True, nullable = True)
    hashed_password = Column(String(255),nullable = False)
    username = Column(String(100), nullable = False)
    is_admin = Column(Boolean, nullable = False, server_default = "0")
    created_date = Column(DateTime, server_default = func.now())