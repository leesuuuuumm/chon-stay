"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import DesktopSectionNav from "@/components/DesktopSectionNav";
import AuthNavStatus from "@/components/AuthNavStatus";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { getVillage } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";
import {
  extractErrorMessage,
  fetchHostBookings,
  fetchMyBookings,
  fetchMyVillageApplication,
  type BookingStatus,
  type HostBooking,
  type MyBooking,
  type VillageApplication,
} from "@/lib/api";
import { STATUS_LABEL, formatRequestedDate, formatVisitDate } from "@/lib/hostBookings";

const COUPONS = [
  { id: "c1", title: "재방문 숙박 20% 할인", expires: "6/30까지" },
  { id: "c2", title: "체험 프로그램 5,000원 할인", expires: "7/15까지" },
];

const NAV_ITEMS = [
  { href: "/villages", label: "마을 찾기" },
  { href: "/mypage", label: "마이페이지" },
];

const VILLAGE_STATUS_TEXT: Record<VillageApplication["status"], string> = {
  pending: "대표자 서류를 검토중이에요 (1~2일 소요)",
  approved: "대표자 인증이 승인됐어요",
  rejected: "대표자 인증이 거절됐어요. 서류를 다시 확인해 재신청해주세요.",
};

const MY_BOOKING_STATUS_TEXT: Record<BookingStatus, string> = {
  pending: "승인 대기",
  approved: "예약 확정",
  rejected: "거절됨",
};

export default function MyPage() {
  const { subscribedVillageIds, lastVisitedVillageId, user, accessToken } = useAppStore();
  const [showCoupons, setShowCoupons] = useState(false);
  const [villageApplication, setVillageApplication] = useState<VillageApplication | null>(null);

  const [hostBookings, setHostBookings] = useState<HostBooking[] | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<MyBooking[] | null>(null);
  const [myBookingsError, setMyBookingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyBookings(accessToken)
      .then(setMyBookings)
      .catch((err) => setMyBookingsError(extractErrorMessage(err, "내 예약 내역을 불러오지 못했어요.")));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyVillageApplication(accessToken).then(setVillageApplication).catch(() => {});
  }, [accessToken]);

  const isApprovedHost = villageApplication?.status === "approved";
  useEffect(() => {
    if (!accessToken || !isApprovedHost) return;
    fetchHostBookings(accessToken)
      .then(setHostBookings)
      .catch((err) => setBookingsError(extractErrorMessage(err, "예약 내역을 불러오지 못했어요.")));
  }, [accessToken, isApprovedHost]);

  const pendingCount = hostBookings?.filter((b) => b.status === "pending").length ?? 0;

  const subscribed = subscribedVillageIds.map((id) => getVillage(id)).filter(Boolean);
  const lastVillage = lastVisitedVillageId ? getVillage(lastVisitedVillageId) : null;

  return (
    <>
      <DesktopSectionNav items={NAV_ITEMS} right={<AuthNavStatus />} />
      <Shell withBottomPadding size="wide">
        <AppHeader title="내 마을" stage="관계" showBack={false} />
        <div className="flex-1 space-y-5 px-5 py-5 md:px-8 lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-8 lg:space-y-0">
          <div className="space-y-5">
            {!user && (
              <div className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 md:hidden">
                <p className="text-sm text-ink-soft">로그인하면 다른 기기에서도 확인할 수 있어요</p>
                <Link href="/login" className="shrink-0 text-sm font-semibold underline underline-offset-2">
                  로그인
                </Link>
              </div>
            )}
            {villageApplication && (
              <Card className="space-y-2">
                <p className="text-sm font-semibold">마을 대표자 신청 현황</p>
                <p className="text-sm text-ink-soft">
                  {villageApplication.representative_name}님 · {VILLAGE_STATUS_TEXT[villageApplication.status]}
                </p>
                {villageApplication.status === "approved" && (
                  <Link
                    href="/host/onboarding"
                    className="inline-block text-sm font-semibold text-clay-600 underline underline-offset-2"
                  >
                    마을·체험·숙소 정보 수정하기
                  </Link>
                )}
              </Card>
            )}

            {isApprovedHost && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-soft">
                    우리 마을에 들어온 예약
                    {pendingCount > 0 && (
                      <span className="ml-2 text-clay-600">승인 대기 {pendingCount}건</span>
                    )}
                  </p>
                  <Link href="/host/reservations" className="text-xs text-ink-faint underline">
                    예약 관리
                  </Link>
                </div>
                {bookingsError ? (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{bookingsError}</p>
                ) : hostBookings === null ? (
                  <p className="text-sm text-ink-faint">불러오는 중...</p>
                ) : hostBookings.length === 0 ? (
                  <Card className="py-6 text-center text-sm text-ink-faint">
                    아직 들어온 예약이 없어요.
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {hostBookings.slice(0, 5).map((b) => (
                      <Card key={b.id} className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {b.applicant_name} · {b.headcount}인
                          </p>
                          <Badge tone={b.status === "approved" ? "leaf" : "neutral"}>
                            {STATUS_LABEL[b.status]}
                          </Badge>
                        </div>
                        <ul className="space-y-0.5 text-sm text-ink-soft">
                          {b.items.map((item, i) => (
                            <li key={i} className="flex justify-between gap-2">
                              <span>
                                <span className="mr-1.5 text-xs text-ink-faint">
                                  {item.type === "experience" ? "체험" : "숙박"}
                                </span>
                                {item.title}
                              </span>
                              <span>{item.subtotal.toLocaleString()}원</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-ink-faint">
                          방문 {formatVisitDate(b.start_date)} · 신청 {formatRequestedDate(b.requested_at)} · 합계{" "}
                          {b.total_price.toLocaleString()}원
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {accessToken && (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink-soft">내 예약</p>
                {myBookingsError ? (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{myBookingsError}</p>
                ) : myBookings === null ? (
                  <p className="text-sm text-ink-faint">불러오는 중...</p>
                ) : myBookings.length === 0 ? (
                  <Card className="py-6 text-center text-sm text-ink-faint">
                    아직 예약한 내역이 없어요.
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {myBookings.map((b) => (
                      <Card key={b.id} className={`space-y-1.5 ${b.status === "rejected" ? "opacity-60" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{b.village_name ?? "마을"}</p>
                          <Badge tone={b.status === "approved" ? "leaf" : "neutral"}>
                            {MY_BOOKING_STATUS_TEXT[b.status]}
                          </Badge>
                        </div>
                        <ul className="space-y-0.5 text-sm text-ink-soft">
                          {b.items.map((item, i) => (
                            <li key={i} className="flex justify-between gap-2">
                              <span>
                                <span className="mr-1.5 text-xs text-ink-faint">
                                  {item.type === "experience" ? "체험" : "숙박"}
                                </span>
                                {item.title}
                              </span>
                              <span>{item.subtotal.toLocaleString()}원</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-ink-faint">
                          방문 {formatVisitDate(b.start_date)} · {b.headcount}인 · 합계{" "}
                          {b.total_price.toLocaleString()}원
                          {b.status === "approved" && " · 마을에서 예약을 확정했어요"}
                          {b.status === "pending" && " · 마을의 승인을 기다리고 있어요"}
                          {b.status === "rejected" && " · 마을에서 예약을 받을 수 없대요"}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {lastVillage && (
              <div className="rounded-xl bg-clay-100 px-4 py-3 text-sm text-clay-700">
                🌱 지난번 다녀오신 <b>{lastVillage.name}</b>, 수확체험이 시작됐어요
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-soft">구독한 마을</p>
              {subscribed.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {subscribed.map(
                    (v) =>
                      v && (
                        <Link key={v.id} href={`/villages/${v.id}?tab=소식`}>
                          <Card className="text-center">
                            <p className="font-semibold">{v.name.split(" ")[0]}</p>
                            <p className="mt-1 text-xs text-ink-faint">
                              소식 {v.notices.length + v.reviews.length}
                            </p>
                          </Card>
                        </Link>
                      )
                  )}
                </div>
              ) : (
                <Card className="flex flex-col items-center gap-3 py-8 text-center">
                  <p className="text-sm text-ink-faint">아직 관계 맺은 마을이 없어요.</p>
                  <Link
                    href="/villages"
                    className="flex h-11 w-auto items-center justify-center rounded-xl border border-line bg-white px-6 text-sm font-semibold text-ink"
                  >
                    마을 찾아보기
                  </Link>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowCoupons((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold"
            >
              재방문 할인 쿠폰함
              <span className="text-ink-soft">{COUPONS.length}장 {showCoupons ? "▲" : "›"}</span>
            </button>
            {showCoupons && (
              <div className="space-y-2">
                {COUPONS.map((c) => (
                  <Card key={c.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.title}</span>
                    <span className="text-xs text-ink-faint">{c.expires}</span>
                  </Card>
                ))}
              </div>
            )}

            {subscribed[0] && (
              <Link
                href={`/villages/${subscribed[0]!.id}?tab=소식`}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold"
              >
                마을 커뮤니티 게시판
                <span className="text-ink-soft">›</span>
              </Link>
            )}
          </div>
        </div>
        <BottomNav />
      </Shell>
    </>
  );
}
