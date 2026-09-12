from fastapi import APIRouter

router = APIRouter()

# 사용자 유형: 일반 사용자(방문객), 이장(로컬 파트너/마을 관리자)


@router.get("/")
def list_users():
    # TODO: DB 연동
    return {"users": []}


@router.get("/{user_id}")
def get_user(user_id: int):
    # TODO: DB 연동
    return {"user_id": user_id}


@router.post("/")
def create_user():
    # TODO: 회원가입 (일반/이장 구분)
    return {"message": "created"}
