from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse

from app.core.security import create_access_token
from app.core.deps import get_current_user
router = APIRouter()



@router.post("/signup", response_model = UserResponse)
def singup(user_in: UserCreate, db: Session = Depends(get_db)):
    check_email = db.query(User).filter(User.email == user_in.email).first()

    if check_email:
        raise HTTPException(status_code = 400, detail = "이미 가입된 이메일입니다.")

    user = User(
        email = user_in.email,
        hashed_password = hash_password(user_in.password),
        username = user_in.username
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code = 401, detail = "이메일 또는 비밀번호가 틀렸습니다.")

    access_token = create_access_token(data = {"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# 프론트가 email/password 되물음 하기를 방지 하기 위해  저장된 토큰 기반으로 /me를 호출해서 토큰 가진 사람 정보 가져오기

@router.get("/me", response_model =UserResponse)
def get_my_info(current_user: User = Depends(get_current_user)):
    return current_user
