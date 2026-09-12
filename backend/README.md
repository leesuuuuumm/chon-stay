# 촌스테이 백엔드 (FastAPI)

실측 이동 데이터 기반 지역 연계 관광 거점 발굴 + 체류형 생활인구 유입 서비스의 API 서버입니다.

## 실행 방법

\`\`\`bash
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env  # TOUR_API_KEY 등 입력
uvicorn app.main:app --reload
\`\`\`

서버 실행 후 http://localhost:8000/docs 에서 Swagger 문서 확인 가능합니다.

## 디렉터리 구조

\`\`\`
backend/
├── app/
│   ├── main.py          # FastAPI 엔트리포인트
│   ├── core/
│   │   ├── config.py     # 환경설정 (TourAPI 키 등)
│   │   └── database.py   # DB 연결 (로컬 SQLite / 운영 RDS)
│   ├── models/           # SQLAlchemy ORM 모델
│   ├── schemas/          # Pydantic 스키마
│   └── routers/
│       ├── users.py      # 사용자(일반/이장)
│       ├── villages.py   # 마을 + 생활인구 지표
│       ├── houses.py     # 빈집 체험
│       └── matching.py   # 체류 매칭 + TourAPI 연계
├── requirements.txt
└── .env.example
\`\`\`

## DB

- 로컬 개발: SQLite (\`chonstay.db\`, 자동 생성)
- 운영: AWS RDS (MySQL/MariaDB) — \`.env\`의 \`DATABASE_URL\`만 교체하면 전환됩니다.

## 핵심 기능 매핑 (기획 5가지 → 라우터)

1. 체류 매칭 서비스 → \`matching.py\`
2. 관계인구 전환 장치(알림/쿠폰/커뮤니티) → 추후 \`notifications.py\` 등 추가 예정
3. 생활인구 지표 결합 → \`villages.py\`
4. TourAPI 연계 → \`matching.py\`의 \`/tour-spots\`
5. 로컬 파트너 연결 → \`users.py\`(이장) + \`houses.py\`
