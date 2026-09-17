import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "촌스테이 API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./chonstay.db")
    TOUR_API_KEY: str = os.getenv("TOUR_API_KEY", "")  # 한국관광공사 TourAPI 서비스키
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads/village_docs")  # 마을 대표자 인증 서류 저장 경로


settings = Settings()
