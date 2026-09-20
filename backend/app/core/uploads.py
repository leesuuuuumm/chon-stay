import os
import uuid

from fastapi import HTTPException, UploadFile

from app.core.s3 import upload_file_to_s3

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def save_photo(file: UploadFile, subdir: str) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="지원하지 않는 이미지 형식입니다. (jpg/jpeg/png/webp)")

    return upload_file_to_s3(file, folder=f"photos/{subdir}")