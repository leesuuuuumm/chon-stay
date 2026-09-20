from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key = True, index = True)
    user_id = Column(Integer, ForeignKey("users.id"), unique = True, nullable = False)
    representative_name = Column(String(100), nullable = False)
    phone = Column(String(20), nullable = False)
    registration_number = Column(String(10), nullable = False)
    document_path = Column(String(500), nullable = False)
    status = Column(String(20), nullable = False, server_default = "pending")  # pending / approved / rejected
    name = Column(String(200), nullable = True)  # 마을 이름 (승인 후 온보딩에서 입력)
    description = Column(Text, nullable = True)  # 마을 소개
    image_path = Column(String(500), nullable = True)  # 마을 대표 사진 (공개 서빙 경로)
    area_cd = Column(String(2), nullable = True)
    signgu_cd = Column(String(5), nullable=True)
    created_date = Column(DateTime, server_default = func.now())

    user = relationship("User")

    @property
    def email(self):
        return self.user.email if self.user else None
