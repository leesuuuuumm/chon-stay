from datetime import date

from app.models.booking import BookingItem

REVIEW_MAX_LENGTH = 200


def is_review_open(item: BookingItem, today: date) -> bool:
    """리뷰를 쓸 수 있는 시점인지. 숙박은 체크아웃 날짜가 되면, 체험은 방문 당일부터 열린다."""
    if item.end_date is None:
        return False
    return today >= item.end_date


def mask_name(name: str) -> str:
    # 다른 사람에게 보여줄 때는 이름 첫 글자만 남긴다.
    name = name.strip()
    return f"{name[:1]}**" if name else "익명"
