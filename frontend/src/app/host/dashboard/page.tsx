import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/ui/Card";
import { HOST_VILLAGE, HOST_STATS } from "@/lib/mockData";

export default function HostDashboardPage() {
  return (
    <>
      <AppHeader title="대시보드 홈" showBack={false} />
      <div className="space-y-5 px-5 py-5 md:px-8 md:py-8">
        <h2 className="text-xl font-bold md:text-2xl">{HOST_VILLAGE.name}</h2>

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Card className="text-center md:py-6">
            <p className="text-2xl font-extrabold md:text-3xl">{HOST_STATS.newReservations}</p>
            <p className="mt-1 text-xs text-ink-faint">신규 예약</p>
          </Card>
          <Card className="text-center md:py-6">
            <p className="text-2xl font-extrabold md:text-3xl">{HOST_STATS.todayVisits}</p>
            <p className="mt-1 text-xs text-ink-faint">오늘 방문</p>
          </Card>
          <Card className="text-center md:py-6">
            <p className="text-2xl font-extrabold text-clay-600 md:text-3xl">{HOST_STATS.unreadReviews}</p>
            <p className="mt-1 text-xs text-ink-faint">미확인 리뷰</p>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-soft">이번 주 방문 일정</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {HOST_VILLAGE.calendar.map((c) => (
                <Card key={c.date} className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{c.date}</span>
                  <span className="text-sm text-ink-soft">{c.label}</span>
                </Card>
              ))}
            </div>
          </div>

          <Link
            href="/host/reservations"
            className="block rounded-xl bg-clay-100 px-4 py-3.5 text-center text-sm font-semibold text-clay-700 lg:py-6"
          >
            ⚠ 새 예약 신청 {HOST_STATS.newReservations}건 확인 필요
          </Link>
        </div>
      </div>
    </>
  );
}
