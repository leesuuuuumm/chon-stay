import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import users, villages, houses, matching, listings
from app.core.config import settings
from app.core.database import Base, engine
from app.models import user, village, listing

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="촌스테이 API",
    description="실측 이동 데이터 기반 지역 연계 관광 거점 발굴 및 체류형 생활인구 유입 서비스",
    version="0.1.0",
)

Base.metadata.create_all(bind = engine)

os.makedirs(settings.PHOTO_UPLOAD_DIR, exist_ok = True)
app.mount(settings.MEDIA_URL_PREFIX, StaticFiles(directory = settings.PHOTO_UPLOAD_DIR), name = "media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: 배포 시 프론트엔드 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(villages.router, prefix="/api/villages", tags=["villages"])
app.include_router(houses.router, prefix="/api/houses", tags=["houses"])
app.include_router(listings.router, prefix="/api/listings", tags=["listings"])
app.include_router(matching.router, prefix="/api/matching", tags=["matching"])


@app.get("/")
def root():
    return {"service": "촌스테이", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
