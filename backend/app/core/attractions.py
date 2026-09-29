"""전국관광지정보표준데이터(data/attractions.csv) — TourAPI를 못 쓸 때 인근 관광지 폴백."""
import csv
import os
from functools import lru_cache

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "attractions.csv")

# "충청남도" / "충남" / "강원특별자치도" 등을 같은 키로 맞춘다.
_SIDO_SHORT = {
    "충청북": "충북", "충청남": "충남", "전라북": "전북", "전북특": "전북",
    "전라남": "전남", "경상북": "경북", "경상남": "경남",
}


def _sido_key(sido: str) -> str:
    return _SIDO_SHORT.get(sido[:3], sido[:2])


@lru_cache(maxsize=1)
def _load_rows() -> list[dict]:
    for encoding in ("utf-8-sig", "cp949"):
        try:
            with open(CSV_PATH, encoding=encoding, newline="") as f:
                return list(csv.DictReader(f))
        except UnicodeDecodeError:
            continue
        except FileNotFoundError:
            return []
    return []


def find_attractions(sido: str | None, sigungu: str | None, limit: int = 5) -> list[dict]:
    if not sigungu:
        return []
    results = []
    for row in _load_rows():
        name = (row.get("관광지명") or "").strip()
        addr = (row.get("소재지도로명주소") or row.get("소재지지번주소") or "").strip()
        tokens = addr.split()
        if not name or len(tokens) < 2 or tokens[1] != sigungu:
            continue
        if sido and _sido_key(tokens[0]) != _sido_key(sido):
            continue
        desc = (row.get("관광지소개") or "").strip()
        results.append({
            "title": name,
            "category": (row.get("관광지구분") or "").strip() or None,
            "description": desc or None,
            "address": addr,
        })
    # 소개글이 있는 곳 먼저
    results.sort(key=lambda r: r["description"] is None)
    return results[:limit]
