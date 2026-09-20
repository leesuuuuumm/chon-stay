from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.coupons import today_kst
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.reviews import is_review_open, mask_name
from app.models.booking import Booking, BookingItem
from app.models.listing import Experience, Lodging
from app.models.review import Review
from app.models.user import User
from app.routers.village_detail import experience_key, lodging_key
from app.schemas.review import MyReview, ReviewCreate, ReviewListResponse, ReviewResponse, ReviewUpdate

router = APIRouter()


@router.post("/", response_model=MyReview)
def create_review(
    req: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = req.comment.strip()
    if not comment:
        raise HTTPException(status_code=400, detail="리뷰 내용을 입력해주세요.")

    row = (
        db.query(BookingItem, Booking)
        .join(Booking, Booking.id == BookingItem.booking_id)
        .filter(BookingItem.id == req.booking_item_id, Booking.account_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="예약 항목을 찾을 수 없습니다.")
    item, booking = row
    if booking.status != "approved":
        raise HTTPException(status_code=400, detail="확정된 예약만 리뷰를 쓸 수 있어요.")
    if not is_review_open(item, today_kst()):
        raise HTTPException(status_code=400, detail="아직 리뷰를 쓸 수 있는 시기가 아니에요.")
    if db.query(Review.id).filter(Review.booking_item_id == item.id).first():
        raise HTTPException(status_code=409, detail="이미 리뷰를 작성했어요.")

    review = Review(
        booking_item_id=item.id,
        account_id=current_user.id,
        village_id=booking.village_id,
        experience_id=item.experience_id,
        lodging_id=item.lodging_id,
        rating=req.rating,
        comment=comment,
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()  # 동시에 두 번 제출된 경우
        raise HTTPException(status_code=409, detail="이미 리뷰를 작성했어요.")
    db.refresh(review)
    return MyReview(
        id=review.id, rating=review.rating, comment=review.comment, created_date=review.created_date
    )


def _my_review(db: Session, review_id: int, user: User) -> Review:
    review = db.query(Review).filter(Review.id == review_id, Review.account_id == user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다.")
    return review


@router.patch("/{review_id}", response_model=MyReview)
def update_review(
    review_id: int,
    req: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = req.comment.strip()
    if not comment:
        raise HTTPException(status_code=400, detail="리뷰 내용을 입력해주세요.")
    review = _my_review(db, review_id, current_user)
    review.rating = req.rating
    review.comment = comment
    db.commit()
    db.refresh(review)
    return MyReview(
        id=review.id, rating=review.rating, comment=review.comment, created_date=review.created_date
    )


@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.delete(_my_review(db, review_id, current_user))
    db.commit()


@router.get("/", response_model=ReviewListResponse)
def list_reviews(
    experience_id: Optional[int] = None,
    lodging_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    if (experience_id is None) == (lodging_id is None):
        raise HTTPException(status_code=400, detail="experience_id 또는 lodging_id 중 하나만 지정해주세요.")

    # 마을 상세에서는 같은 내용의 중복 등록 항목을 하나로 합쳐 보여주므로, 리뷰도 함께 모은다.
    if experience_id is not None:
        target = db.query(Experience).filter(Experience.id == experience_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="체험을 찾을 수 없습니다.")
        siblings = db.query(Experience).filter(Experience.village_id == target.village_id).all()
        ids = [e.id for e in siblings if experience_key(e) == experience_key(target)]
        condition = Review.experience_id.in_(ids)
    else:
        target = db.query(Lodging).filter(Lodging.id == lodging_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="숙소를 찾을 수 없습니다.")
        siblings = db.query(Lodging).filter(Lodging.village_id == target.village_id).all()
        ids = [l.id for l in siblings if lodging_key(l) == lodging_key(target)]
        condition = Review.lodging_id.in_(ids)

    rows = (
        db.query(Review, User.username)
        .join(User, User.id == Review.account_id)
        .filter(condition)
        .order_by(Review.created_date.desc(), Review.id.desc())
        .all()
    )
    average = db.query(func.avg(Review.rating)).filter(condition).scalar()
    return ReviewListResponse(
        count=len(rows),
        average_rating=round(float(average), 1) if average is not None else None,
        reviews=[
            ReviewResponse(
                id=review.id,
                author=mask_name(username),
                rating=review.rating,
                comment=review.comment,
                created_date=review.created_date,
            )
            for review, username in rows
        ],
    )
