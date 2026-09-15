"use client";

import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import DesktopSectionNav from "@/components/DesktopSectionNav";
import AuthNavStatus from "@/components/AuthNavStatus";
import VillageCard from "@/components/VillageCard";
import { VILLAGES } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";

const urgencyScore = { high: 2, medium: 1, low: 0 } as const;

const NAV_ITEMS = [
  { href: "/villages", label: "마을 찾기" },
  { href: "/mypage", label: "마이페이지" },
];

export default function VillagesPage() {
  const { interests } = useAppStore();
  const [sort, setSort] = useState<"impact" | "match">("impact");

  const villages = useMemo(() => {
    const matched = interests.length
      ? VILLAGES.filter((v) => v.interestTags.some((tag) => interests.includes(tag)))
      : VILLAGES;
    const list = matched.length ? matched : VILLAGES;
    return [...list].sort((a, b) =>
      sort === "impact"
        ? urgencyScore[b.urgency] - urgencyScore[a.urgency] || b.matchPercent - a.matchPercent
        : b.matchPercent - a.matchPercent
    );
  }, [interests, sort]);

  return (
    <>
      <DesktopSectionNav items={NAV_ITEMS} right={<AuthNavStatus />} />
      <Shell withBottomPadding size="wide">
        <AppHeader title="마을 매칭 추천 결과" stage="발견" />
        <div className="flex items-center gap-2 px-5 pt-4 md:px-8">
          <button className="h-10 flex-1 rounded-full border border-line bg-white px-4 text-left text-sm text-ink-soft md:flex-none md:w-64">
            필터 · 거리/숙박
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "impact" | "match")}
            className="h-10 rounded-full border border-line bg-white px-3 text-sm font-medium text-ink"
          >
            <option value="impact">임팩트 우선순</option>
            <option value="match">매칭순</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
          {villages.map((village) => (
            <VillageCard key={village.id} village={village} />
          ))}
        </div>
        <BottomNav />
      </Shell>
    </>
  );
}
