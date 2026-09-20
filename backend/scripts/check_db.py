"""Workbench 없이 터미널에서 DB(.env의 DATABASE_URL) 데이터를 바로 확인하는 스크립트.

사용법 (backend/ 디렉터리에서 실행):
    python scripts/check_db.py                # 모든 테이블의 전체 데이터
    python scripts/check_db.py users           # users 테이블 전체 데이터
    python scripts/check_db.py users 50        # users 테이블 최근 50건만
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text  # noqa: E402

from app.core.database import engine  # noqa: E402


def main():
    only_table = sys.argv[1] if len(sys.argv) > 1 else None
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None

    inspector = inspect(engine)
    all_tables = inspector.get_table_names()

    if only_table:
        if only_table not in all_tables:
            print(f"테이블 '{only_table}'을 찾을 수 없어요. 존재하는 테이블: {all_tables}")
            return
        tables = [only_table]
    else:
        tables = all_tables
        if not tables:
            print("DB에 테이블이 하나도 없어요. (모델이 아직 create_all 되지 않았을 수 있어요)")
            return

    with engine.connect() as conn:
        for t in tables:
            count = conn.execute(text(f"SELECT COUNT(*) FROM `{t}`")).scalar()
            print(f"\n=== {t} ({count}건) ===")
            if not count:
                continue
            limit_clause = f" LIMIT {limit}" if limit else ""
            result = conn.execute(text(f"SELECT * FROM `{t}` ORDER BY 1 DESC{limit_clause}"))
            cols = list(result.keys())
            print(" | ".join(cols))
            for row in result:
                print(" | ".join(str(v) for v in row))


if __name__ == "__main__":
    main()
