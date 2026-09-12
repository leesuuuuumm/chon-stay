# 촌스테이 프론트엔드 (Next.js)

## 실행 방법

\`\`\`bash
npm install
cp .env.local.example .env.local
npm run dev
\`\`\`

http://localhost:3000 에서 확인 가능합니다. (백엔드는 http://localhost:8000 에서 먼저 실행)

## 디렉터리 구조

\`\`\`
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx      # 홈
│   │   └── globals.css
│   ├── components/       # 공용 컴포넌트 (VillageCard 등)
│   └── lib/
│       └── api.ts        # 백엔드 API 클라이언트 (axios)
├── package.json
└── tailwind.config.js
\`\`\`

> 원래 React Native + Expo로 계획했으나, 앱스토어 심사 기간 리스크로 웹(Next.js)으로 전환했습니다.
