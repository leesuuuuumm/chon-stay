"""사진 업로드 기능 추가에 따른 DB 마이그레이션.

villages 테이블에 image_path 컬럼이 이미 있는 DB(운영 RDS 등)는 SQLAlchemy의
Base.metadata.create_all()이 기존 테이블에 컬럼을 추가해주지 않으므로, 이 스크립트로
직접 ALTER TABLE을 실행한다. (experience_images/lodging_images 테이블은 새 테이블이라
create_all()로 자동 생성된다.)

사용법 (backend/ 디렉터리에서 실행):
    python scripts/migrate_add_photos.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text  # noqa: E402

from app.core.database import Base, engine  # noqa: E402
from app.models import listing, user, village  # noqa: E402, F401


def main():
    Base.metadata.create_all(bind = engine)  # 새 테이블(experience_images/lodging_images) 생성

    inspector = inspect(engine)
    village_columns = {col["name"] for col in inspector.get_columns("villages")}
    if "image_path" in village_columns:
        print("villages.image_path 컬럼이 이미 있어요. 건너뜁니다.")
        return

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE villages ADD COLUMN image_path VARCHAR(500) NULL"))
    print("villages.image_path 컬럼을 추가했어요.")


if __name__ == "__main__":
    main()
