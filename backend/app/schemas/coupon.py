from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CouponResponse(BaseModel):
    id: int
    code: str
    title: str
    discount_percent: int
    applies_to: str = "all"
    status: str  # available | used | expired
    issued_at: datetime
    expires_at: datetime
    used_at: Optional[datetime] = None
