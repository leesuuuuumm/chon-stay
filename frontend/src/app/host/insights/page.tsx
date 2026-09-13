import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/ui/Card";
import { HOST_INSIGHTS } from "@/lib/mockData";

export default function HostInsightsPage() {
  const max = Math.max(...HOST_INSIGHTS.visitTrend);

  return (
    <>
      <AppHeader title="통계·인사이트" showBack={false} />
      <div className="space-y-4 px-5 py-5">
        <h2 className="text-lg font-bold">마을 인사이트</h2>

        <Card>
          <p className="text-sm font-semibold text-ink-soft">방문 신청 추이</p>
          <div className="mt-4 flex h-24 items-end gap-2">
            {HOST_INSIGHTS.visitTrend.map((v, i) => {
              const isLast = i === HOST_INSIGHTS.visitTrend.length - 1;
              return (
                <div
                  key={i}
                  style={{ height: `${(v / max) * 100}%` }}
                  className={`flex-1 rounded-t-md ${isLast ? "bg-clay-500" : "bg-sand-dark"}`}
                />
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-extrabold text-clay-600">{HOST_INSIGHTS.revisitRate}%</p>
            <p className="mt-1 text-xs text-ink-faint">재방문율 · 핵심 KPI</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-extrabold">{HOST_INSIGHTS.avgRating}</p>
            <p className="mt-1 text-xs text-ink-faint">평균 평점</p>
          </Card>
        </div>

        <Card className="border-dashed text-sm text-ink-faint">인구 유입 지표 (빈집·인구 현황 연계)</Card>

        <Link
          href="/host/onboarding"
          className="block pt-2 text-center text-xs text-ink-faint underline underline-offset-2"
        >
          ↺ 인사이트 확인 후 ②정보 등록으로 순환
        </Link>
      </div>
    </>
  );
}
