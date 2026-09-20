"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import DesktopSectionNav from "@/components/DesktopSectionNav";
import AuthNavStatus from "@/components/AuthNavStatus";
import Card from "@/components/ui/Card";
import { getVillage } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";
import { fetchMyVillageApplication, type VillageApplication } from "@/lib/api";

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

export default function MyPage() {
  const { subscribedVillageIds, lastVisitedVillageId, user, accessToken } = useAppStore();
  const [showCoupons, setShowCoupons] = useState(false);
  const [villageApplication, setVillageApplication] = useState<VillageApplication | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyVillageApplication(accessToken).then(setVillageApplication).catch(() => {});
  }, [accessToken]);

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
