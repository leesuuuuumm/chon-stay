import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

export default function Home() {
  return (
    <main className="min-h-screen bg-sand">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Badge tone="clay">발견 → 체험 → 관계</Badge>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight">
          촌스테이
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          관심사에 맞는 마을을 매칭해 체류형 농촌 여행을 제안하고, 빈집 체험과 밭 가꾸기로
          자연스러운 재방문을 만드는 서비스입니다. 일회성 관광을 지속가능한 생활인구 유입으로
          전환합니다.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <PhotoPlaceholder emoji="🧳" label="여행자" className="h-32 rounded-xl" />
            <div>
              <h2 className="text-lg font-bold">여행자이신가요?</h2>
              <p className="mt-1 text-sm text-ink-soft">
                관심사를 알려주시면 딱 맞는 마을과 체류 코스를 추천해드려요.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="flex h-12 items-center justify-center rounded-xl bg-ink font-semibold text-white transition-colors hover:bg-ink/90"
            >
              여행자로 시작하기
            </Link>
          </Card>

          <Card className="flex flex-col gap-4">
            <PhotoPlaceholder emoji="🏘️" label="마을 대표자" className="h-32 rounded-xl" />
            <div>
              <h2 className="text-lg font-bold">마을 대표자·이장이신가요?</h2>
              <p className="mt-1 text-sm text-ink-soft">
                마을을 등록하고 예약·리뷰·방문 인사이트를 한곳에서 관리하세요.
              </p>
            </div>
            <Link
              href="/host/signup"
              className="flex h-12 items-center justify-center rounded-xl bg-clay-500 font-semibold text-white transition-colors hover:bg-clay-600"
            >
              마을 등록하기
            </Link>
          </Card>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {[
            "체류 매칭 서비스 (관심사-마을 매칭 코스추천)",
            "관계인구 전환 장치 (재방문 유도 알림·쿠폰·커뮤니티)",
            "생활인구 지표 결합 (인구감소 심각도 시각화)",
            "로컬 파트너 연결 (주민-방문자 매칭, 빈집·밭 체험)",
          ].map((f) => (
            <div key={f} className="flex items-start gap-2 text-sm text-ink-soft">
              <span className="mt-0.5 text-leaf-500">●</span>
              {f}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
