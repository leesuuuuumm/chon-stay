from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.village import Village

oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "/api/users/login")


def get_current_user(token: str = Depends(oauth2_scheme),db:Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail = "유효하지 않은 토큰입니다.")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED, detail = "사용자를 찾을 수 없습니다.")

    return user


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN, detail = "관리자만 접근할 수 있습니다.")

    return current_user


def get_current_approved_village(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Village:
    village = db.query(Village).filter(Village.user_id == current_user.id).first()
    if not village:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "마을 대표자 신청 내역이 없습니다.")
    if village.status != "approved":
        raise HTTPException(status_code = status.HTTP_403_FORBIDDEN, detail = "승인된 마을 대표자만 이용할 수 있습니다.")

    return village
