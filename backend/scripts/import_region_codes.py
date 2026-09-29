import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import csv
from dotenv import load_dotenv
load_dotenv()

from app.core.database import SessionLocal, Base, engine
from app.models.region_code import RegionCode

Base.metadata.create_all(bind=engine)


def import_csv(filepath: str):
    db = SessionLocal()
    seen = set()

    with open(filepath, encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader, None)

        for row in reader:
            if len(row) < 3:
                continue
            code, sido, sigungu = row[0].strip(), row[1].strip(), row[2].strip()

            if not sido or not sigungu:
                continue

            key = (sido, sigungu)
            if key in seen:
                continue
            seen.add(key)

            area_cd = code[:2]
            signgu_cd = code[:5]

            db.add(RegionCode(sido=sido, sigungu=sigungu, area_cd=area_cd, signgu_cd=signgu_cd))

    db.commit()
    print(f"총 {len(seen)}개 시군구 등록 완료")
    db.close()


if __name__ == "__main__":
    import_csv("data/region_codes.csv")