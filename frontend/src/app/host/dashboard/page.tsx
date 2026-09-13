import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/ui/Card";
import { HOST_VILLAGE, HOST_STATS } from "@/lib/mockData";

export default function HostDashboardPage() {
  return (
    <>
      <AppHeader title="대시보드 홈" showBack={false} />
      <div className="space-y-5 px-5 py-5">
        <h2 className="text-xl font-bold">{HOST_VILLAGE.name}</h2>

        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-extrabold">{HOST_STATS.newReservations}</p>
            <p className="mt-1 text-xs text-ink-faint">신규 예약</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-extrabold">{HOST_STATS.todayVisits}</p>
            <p className="mt-1 text-xs text-ink-faint">오늘 방문</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-extrabold text-clay-600">{HOST_STATS.unreadReviews}</p>
            <p className="mt-1 text-xs text-ink-faint">미확인 리뷰</p>
          </Card>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-soft">이번 주 방문 일정</p>
          <div className="space-y-2">
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
          className="block rounded-xl bg-clay-100 px-4 py-3.5 text-center text-sm font-semibold text-clay-700"
        >
          ⚠ 새 예약 신청 {HOST_STATS.newReservations}건 확인 필요
        </Link>
      </div>
    </>
  );
}
