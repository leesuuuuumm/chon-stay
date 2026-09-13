"use client";

import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import VillageCard from "@/components/VillageCard";
import { VILLAGES } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";

const urgencyScore = { high: 2, medium: 1, low: 0 } as const;

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
    <Shell withBottomPadding>
      <AppHeader title="마을 매칭 추천 결과" stage="발견" />
      <div className="flex items-center gap-2 px-5 pt-4">
        <button className="h-10 flex-1 rounded-full border border-line bg-white px-4 text-left text-sm text-ink-soft">
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

      <div className="flex flex-col gap-4 px-5 py-5">
        {villages.map((village) => (
          <VillageCard key={village.id} village={village} />
        ))}
      </div>
      <BottomNav />
    </Shell>
  );
}
