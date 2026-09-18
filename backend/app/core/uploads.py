import os
import uuid

from fastapi import HTTPException, UploadFile

from app.core.config import settings

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def save_photo(file: UploadFile, subdir: str) -> str:
    """이미지 파일을 PHOTO_UPLOAD_DIR/subdir에 저장하고 공개 서빙 URL을 반환한다."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code = 400, detail = "지원하지 않는 이미지 형식입니다. (jpg/jpeg/png/webp)")

    target_dir = os.path.join(settings.PHOTO_UPLOAD_DIR, subdir)
    os.makedirs(target_dir, exist_ok = True)
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(target_dir, stored_filename)
    with open(stored_path, "wb") as out_file:
        out_file.write(file.file.read())

    return f"{settings.MEDIA_URL_PREFIX}/{subdir}/{stored_filename}"
