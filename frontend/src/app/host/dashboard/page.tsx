"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { fetchMyVillageApplication } from "@/lib/api";
import {
  STATUS_LABEL,
  addDaysIso,
  bookingTitle,
  formatRequestedDate,
  formatVisitDate,
  todayIso,
  useHostBookings,
} from "@/lib/hostBookings";

export default function HostDashboardPage() {
  const { hydrated, accessToken, bookings, loading, error } = useHostBookings();
  const [villageName, setVillageName] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyVillageApplication(accessToken)
      .then((village) => setVillageName(village?.name ?? null))
      .catch(() => setVillageName(null));
  }, [accessToken]);

  const today = todayIso();
  const weekEnd = addDaysIso(6);
  const pending = bookings.filter((b) => b.status === "pending");
  const approved = bookings.filter((b) => b.status === "approved");
  const todayVisits = approved.filter((b) => b.start_date <= today && today <= b.end_date);
  const upcoming = approved.filter((b) => b.end_date >= today).length;
  const thisWeek = approved
    .filter((b) => b.end_date >= today && b.start_date <= weekEnd)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const recent = bookings.slice(0, 5);

  const stats = [
    { label: "신규 예약", value: pending.length, accent: false },
    { label: "오늘 방문", value: todayVisits.length, accent: false },
    { label: "확정 예약", value: upcoming, accent: true },
  ];

  return (
    <>
      <AppHeader title="대시보드 홈" showBack={false} />
      <div className="space-y-5 px-5 py-5 md:px-8 md:py-8">
        <h2 className="text-xl font-bold md:text-2xl">{villageName ?? "우리 마을"}</h2>

        {!hydrated || loading ? (
          <p className="py-10 text-center text-sm text-ink-faint">불러오는 중...</p>
        ) : !accessToken ? (
          <p className="py-10 text-center text-sm text-ink-soft">
            <Link href="/login?redirect=/host/dashboard" className="font-semibold underline">
              로그인
            </Link>
            이 필요해요.
          </p>
        ) : error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {stats.map((s) => (
                <Card key={s.label} className="text-center md:py-6">
                  <p
                    className={`text-2xl font-extrabold md:text-3xl ${s.accent ? "text-clay-600" : ""}`}
                  >
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">{s.label}</p>
                </Card>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[2fr_1fr] lg:items-start">
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink-soft">이번 주 방문 일정</p>
                  {thisWeek.length === 0 ? (
                    <p className="text-sm text-ink-faint">이번 주 확정된 방문이 없어요.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      {thisWeek.map((b) => (
                        <Card key={b.id} className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{formatVisitDate(b.start_date)}</span>
                          <span className="text-right text-sm text-ink-soft">
                            {b.applicant_name} · {b.headcount}인 · {bookingTitle(b)}
                          </span>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-soft">최근 예약 신청</p>
                    <Link href="/host/reservations" className="text-xs text-ink-faint underline">
                      전체 보기
                    </Link>
                  </div>
                  {recent.length === 0 ? (
                    <p className="text-sm text-ink-faint">아직 들어온 예약 신청이 없어요.</p>
                  ) : (
                    <div className="grid gap-2">
                      {recent.map((b) => (
                        <Card key={b.id} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {b.applicant_name} · {b.headcount}인 · {bookingTitle(b)}
                            </p>
                            <p className="text-xs text-ink-faint">
                              방문 {formatVisitDate(b.start_date)} · 신청 {formatRequestedDate(b.requested_at)} ·{" "}
                              {b.total_price.toLocaleString()}원
                            </p>
                          </div>
                          <Badge tone={b.status === "approved" ? "leaf" : "neutral"}>
                            {STATUS_LABEL[b.status]}
                          </Badge>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {pending.length > 0 && (
                <Link
                  href="/host/reservations"
                  className="block rounded-xl bg-clay-100 px-4 py-3.5 text-center text-sm font-semibold text-clay-700 lg:py-6"
                >
                  ⚠ 새 예약 신청 {pending.length}건 확인 필요
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
