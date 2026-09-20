import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/ui/Card";
import { HOST_INSIGHTS, HOST_VILLAGE } from "@/lib/mockData";

export default function HostInsightsPage() {
  const max = Math.max(...HOST_INSIGHTS.visitTrend);
  const stats = HOST_VILLAGE.populationStats;
  const latest = stats[stats.length - 1];
  const previous = stats.length > 1 ? stats[stats.length - 2] : null;
  const populationDelta = previous ? latest.population - previous.population : null;

  return (
    <>
      <AppHeader title="통계·인사이트" />
      <div className="space-y-4 px-5 py-5 md:px-8 md:py-8">
        <h2 className="text-lg font-bold md:text-xl">마을 인사이트</h2>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="lg:row-span-2">
            <p className="text-sm font-semibold text-ink-soft">방문 신청 추이</p>
            <div className="mt-4 flex h-24 items-end gap-2 md:h-40">
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

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Card className="text-center md:py-6">
              <p className="text-2xl font-extrabold text-clay-600 md:text-3xl">{HOST_INSIGHTS.revisitRate}%</p>
              <p className="mt-1 text-xs text-ink-faint">재방문율 · 핵심 KPI</p>
            </Card>
            <Card className="text-center md:py-6">
              <p className="text-2xl font-extrabold md:text-3xl">{HOST_INSIGHTS.avgRating}</p>
              <p className="mt-1 text-xs text-ink-faint">평균 평점</p>
            </Card>
          </div>
        </div>

        <Card>
          <p className="text-sm font-semibold text-ink-soft">인구 유입 지표 ({latest.statYear}년 기준)</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xl font-extrabold md:text-2xl">
                {latest.population.toLocaleString()}명
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                생활인구
                {populationDelta !== null && (
                  <span className={populationDelta < 0 ? "text-red-500" : "text-leaf-600"}>
                    {" "}
                    ({populationDelta > 0 ? "+" : ""}
                    {populationDelta.toLocaleString()})
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xl font-extrabold md:text-2xl">{latest.vacantHouses}채</p>
              <p className="mt-1 text-xs text-ink-faint">빈집 현황 (체험·숙박 연계 가능)</p>
            </div>
          </div>
        </Card>

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
