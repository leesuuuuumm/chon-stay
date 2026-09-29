import os
import time
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

# ── 국문 관광정보 서비스(KorService2): 인근 축제·관광지 ──────────────────────
# 공공데이터포털에서 "한국관광공사_국문 관광정보 서비스_GW" 활용신청이 되어 있어야 한다.
KOR_SERVICE_URL = "https://apis.data.go.kr/B551011/KorService2"
_NEARBY_CACHE_TTL = 6 * 60 * 60  # 축제/관광지 정보는 자주 안 바뀌므로 6시간 캐시
_nearby_cache: dict[tuple, tuple[float, list[dict]]] = {}


def _split_signgu_cd(signgu_cd: str | None) -> tuple[str, str] | None:
    """법정동 시군구코드 5자리(예: 44760) → (lDongRegnCd "44", lDongSignguCd "760")"""
    if not signgu_cd or len(signgu_cd) != 5:
        return None
    return signgu_cd[:2], signgu_cd[2:]


def _kor_service_items(operation: str, params: dict) -> list[dict] | None:
    """KorService2 호출. 실패(키 미등록·타임아웃 등) 시 None."""
    api_key = os.getenv("TOUR_API_KEY")
    if not api_key:
        return None

    base = {
        "serviceKey": api_key,
        "MobileApp": "chonstay",
        "MobileOS": "ETC",
        "_type": "json",
        "pageNo": 1,
    }
    try:
        res = requests.get(f"{KOR_SERVICE_URL}/{operation}", params={**base, **params}, timeout=5)
        res.raise_for_status()
        body = res.json().get("response", {}).get("body", {})
        items = body.get("items")
        if not items:  # 결과가 없으면 items가 "" 로 온다
            return []
        item = items.get("item", [])
        return item if isinstance(item, list) else [item]
    except Exception:
        return None


def _cached(key: tuple, fetch) -> list[dict] | None:
    now = time.time()
    hit = _nearby_cache.get(key)
    if hit and now - hit[0] < _NEARBY_CACHE_TTL:
        return hit[1]
    result = fetch()
    if result is not None:  # 실패는 캐시하지 않는다
        _nearby_cache[key] = (now, result)
    return result


def _image_url(url: str | None) -> str | None:
    return url.replace("http://", "https://", 1) if url else None


def get_nearby_festivals(signgu_cd: str | None, limit: int = 10) -> list[dict] | None:
    """오늘 이후 진행 중이거나 예정된 축제. 실패 시 None."""
    codes = _split_signgu_cd(signgu_cd)
    if not codes:
        return []
    today = datetime.now().strftime("%Y%m%d")

    def fetch():
        items = _kor_service_items("searchFestival2", {
            "numOfRows": limit,
            "arrange": "A",
            "eventStartDate": today,
            "lDongRegnCd": codes[0],
            "lDongSignguCd": codes[1],
        })
        if items is None:
            return None
        festivals = [
            {
                "content_id": str(it.get("contentid", "")),
                "title": it.get("title", ""),
                "start_date": it.get("eventstartdate", ""),
                "end_date": it.get("eventenddate", ""),
                "address": it.get("addr1") or None,
                "image_url": _image_url(it.get("firstimage")),
            }
            for it in items
            if it.get("title")
        ]
        # 이미 끝난 축제는 빼고 시작일 순으로
        festivals = [f for f in festivals if not f["end_date"] or f["end_date"] >= today]
        return sorted(festivals, key=lambda f: f["start_date"])

    return _cached(("festival", signgu_cd, today), fetch)


def get_nearby_spots(signgu_cd: str | None, limit: int = 5) -> list[dict] | None:
    """시군구 내 관광지(contentTypeId=12), 이미지 있는 것 우선. 실패 시 None."""
    codes = _split_signgu_cd(signgu_cd)
    if not codes:
        return []

    def fetch():
        items = _kor_service_items("areaBasedList2", {
            "numOfRows": limit,
            "arrange": "Q",  # 이미지 있는 것 중 수정일순
            "contentTypeId": "12",
            "lDongRegnCd": codes[0],
            "lDongSignguCd": codes[1],
        })
        if items is None:
            return None
        return [
            {
                "content_id": str(it.get("contentid", "")),
                "title": it.get("title", ""),
                "address": it.get("addr1") or None,
                "image_url": _image_url(it.get("firstimage")),
            }
            for it in items
            if it.get("title")
        ]

    return _cached(("spot", signgu_cd), fetch)
