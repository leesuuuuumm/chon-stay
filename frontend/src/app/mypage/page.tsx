"use client";

import { useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import Card from "@/components/ui/Card";
import { getVillage } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";

const COUPONS = [
  { id: "c1", title: "재방문 숙박 20% 할인", expires: "6/30까지" },
  { id: "c2", title: "체험 프로그램 5,000원 할인", expires: "7/15까지" },
];

export default function MyPage() {
  const { subscribedVillageIds, lastVisitedVillageId } = useAppStore();
  const [showCoupons, setShowCoupons] = useState(false);

  const subscribed = subscribedVillageIds.map((id) => getVillage(id)).filter(Boolean);
  const lastVillage = lastVisitedVillageId ? getVillage(lastVisitedVillageId) : null;

  return (
    <Shell withBottomPadding>
      <AppHeader title="내 마을" stage="관계" showBack={false} />
      <div className="flex-1 space-y-5 px-5 py-5">
        {lastVillage && (
          <div className="rounded-xl bg-clay-100 px-4 py-3 text-sm text-clay-700">
            🌱 지난번 다녀오신 <b>{lastVillage.name}</b>, 수확체험이 시작됐어요
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-soft">구독한 마을</p>
          {subscribed.length ? (
            <div className="grid grid-cols-2 gap-3">
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

        <button
          onClick={() => setShowCoupons((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold"
        >
          재방문 할인 쿠폰함
          <span className="text-ink-soft">{COUPONS.length}장 {showCoupons ? "▲" : "›"}</span>
        </button>
        {showCoupons && (
          <div className="-mt-3 space-y-2">
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
      <BottomNav />
    </Shell>
  );
}
