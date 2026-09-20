from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, func
from app.core.database import Base
from app.models.enums import DurationOfStay, InterestCode

class Onboarding(Base):
    __tablename__ = "onboarding"

    id = Column(Integer, primary_key=True, index=True)
    duration_of_stay = Column(Enum(DurationOfStay), nullable=False)
    create_date = Column(DateTime, server_default=func.now())
    update_date = Column(DateTime, server_default=func.now(), onupdate=func.now())
    account_id = Column(Integer, ForeignKey("users.id"), nullable=False)   


class OnboardingInterest(Base):
    __tablename__ = "onbarding_interest"

    id = Column(Integer, primary_key=True, index=True)
    interest_code = Column(Enum(InterestCode), nullable=False)
    onboarding_id = Column(Integer, ForeignKey("onboarding.id"), nullable=False)




class OnboardingList(Base):
    __tablename__ = "onboarding_list"

    id = Column(Integer, primary_key=True, index=True)
    explanation = Column(String(500))
    matching_score = Column(Integer)
    alert = Column(Boolean, default=False)
    create_date = Column(DateTime, server_default=func.now())
    update_date = Column(DateTime, server_default=func.now(), onupdate=func.now())
    onboarding_id = Column(Integer, ForeignKey("onboarding.id"), nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)