import os
from datetime import datetime
import requests

TOUR_DEMAND_URL = "https://apis.data.go.kr/B551011/AreaTarDemDsService/areaTarSjrnDsList"


def _previous_month_ym() -> str:
    now = datetime.now()
    year, month = now.year, now.month - 1
    if month == 0:
        month, year = 12, year - 1
    return f"{year}{month:02d}"


def get_area_demand_score(area_cd: str, signgu_cd: str, indicator_cd: str = "2101") -> float | None:
    api_key = os.getenv("TOUR_API_KEY")
    if not api_key or not area_cd or not signgu_cd:
        return None

    params = {
        "serviceKey": api_key,
        "MobileApp": "chonstay",
        "MobileOS": "ETC",
        "_type": "json",
        "areaCd": area_cd,
        "signguCd": signgu_cd,
        "baseYm": _previous_month_ym(),
        "tarSjrnDsIxCd": indicator_cd,
        "numOfRows": 1,
    }

    try:
        res = requests.get(TOUR_DEMAND_URL, params=params, timeout=3)
        res.raise_for_status()
        data = res.json()
        items = data.get("response", {}).get("body", {}).get("items")
        if not items:
            return None
        item = items.get("item")
        if isinstance(item, list):
            item = item[0]
        return float(item["tarSjrnDsIxVal"])
    except Exception:
        return None


def get_decline_score(area_cd: str | None, signgu_cd: str | None) -> float:
    """수요지수를 뒤집어 소외지수로 변환. 실패/코드없음 시 중간값 50."""
    if not area_cd or not signgu_cd:
        return 50.0
    demand = get_area_demand_score(area_cd, signgu_cd)
    if demand is None:
        return 50.0
    return max(0.0, min(100.0, 100.0 - demand))