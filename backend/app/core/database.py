import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 로컬 개발: SQLite / 운영: AWS RDS(MySQL/MariaDB)
# .env의 DATABASE_URL로 전환. 예)
#   로컬:  sqlite:///./chonstay.db
#   운영:  mysql+pymysql://user:password@rds-endpoint:3306/chonstay
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chonstay.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
