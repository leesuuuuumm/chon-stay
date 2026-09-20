from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from app.core.reviews import REVIEW_MAX_LENGTH


class ReviewUpdate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=REVIEW_MAX_LENGTH)


class ReviewCreate(ReviewUpdate):
    booking_item_id: int


class MyReview(BaseModel):
    id: int
    rating: int
    comment: str
    created_date: datetime


class ReviewResponse(BaseModel):
    id: int
    author: str
    rating: int
    comment: str
    created_date: datetime


class ReviewListResponse(BaseModel):
    count: int
    average_rating: float | None = None
    reviews: List[ReviewResponse]
