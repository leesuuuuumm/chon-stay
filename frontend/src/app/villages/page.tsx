'use client';

import { useMemo, useState } from 'react';
import Shell from '@/components/Shell';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import DesktopSectionNav from '@/components/DesktopSectionNav';
import AuthNavStatus from '@/components/AuthNavStatus';
import VillageCard from '@/components/VillageCard';
import { useAppStore } from '@/lib/store';

const NAV_ITEMS = [
  { href: '/villages', label: '마을 찾기' },
  { href: '/mypage', label: '마이페이지' },
];

export default function VillagesPage() {
  const { recommendations } = useAppStore();
  const [sort, setSort] = useState<'impact' | 'match'>('impact');

  const villages = useMemo(() => {
    // VillageRecommendation → VillageCard가 기대하는 형태로 변환
    const mapped = recommendations.map((r) => ({
      id: String(r.village_id),
      name: r.village_name,
      matchTag: r.explanation,
      matchPercent: r.matching_score,
      imagePath: r.image_path ?? null,
      urgencyLabel: r.alert ? '방문객 유입이 특히 필요한 마을' : undefined,
      // VillageCard가 안 쓰지만 Village 타입이 요구할 수 있는 나머지 필드는 임시로 채움
      interestTags: [],
      urgency: r.alert ? ('high' as const) : ('low' as const),
      populationStats: [],
      description: '',
      experiences: [],
      lodgings: [],
      tourSpots: [],
      reviews: [],
      notices: [],
      calendar: [],
    }));

    return [...mapped].sort((a, b) =>
      sort === 'impact'
        ? (b.urgency === 'high' ? 1 : 0) - (a.urgency === 'high' ? 1 : 0) ||
          b.matchPercent - a.matchPercent
        : b.matchPercent - a.matchPercent,
    );
  }, [recommendations, sort]);

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
            onChange={(e) => setSort(e.target.value as 'impact' | 'match')}
            className="h-10 rounded-full border border-line bg-white px-3 text-sm font-medium text-ink"
          >
            <option value="impact">임팩트 우선순</option>
            <option value="match">매칭순</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
          {villages.length > 0 ? (
            villages.map((village) => (
              <VillageCard
                key={village.id}
                village={village}
                imagePath={village.imagePath}
              />
            ))
          ) : (
            <p className="col-span-full py-12 text-center text-sm text-ink-faint">
              추천 결과가 없어요. 관심사를 다시 선택해보세요.
            </p>
          )}
        </div>
        <BottomNav />
      </Shell>
    </>
  );
}
