'use client';

import { useEffect, useState } from 'react';
import { getVillageNearby } from '@/lib/api';
import type { NearbyFestival, VillageNearby } from '@/lib/api';

// 'YYYYMMDD' 또는 'YYYY-MM-DD' → 'YYYYMMDD'
const compact = (d: string) => d.replaceAll('-', '');

function todayCompact() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function toDate(ymd: string) {
  return new Date(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8));
}

function formatRange(start: string, end: string) {
  const f = (ymd: string) => `${+ymd.slice(4, 6)}.${+ymd.slice(6, 8)}`;
  return !end || start === end ? f(start) : `${f(start)} – ${f(end)}`;
}

function festivalBadge(f: NearbyFestival, today: string, visit: string | null) {
  if (visit && f.start_date <= visit && visit <= f.end_date) {
    return { label: '방문일에 열려요', className: 'bg-leaf-600 text-white' };
  }
  if (f.start_date <= today) {
    return { label: '진행 중', className: 'bg-clay-100 text-clay-700' };
  }
  const days = Math.round(
    (toDate(f.start_date).getTime() - toDate(today).getTime()) / 86400000,
  );
  return { label: `D-${days}`, className: 'bg-clay-50 text-ink-soft' };
}

const searchUrl = (q: string) =>
  `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;

export default function NearbySection({
  villageId,
  visitDate,
}: {
  villageId: number;
  visitDate?: string | null;
}) {
  const [data, setData] = useState<VillageNearby | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setFailed(false);
    getVillageNearby(villageId)
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [villageId]);

  if (failed) return null;

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-4 text-sm text-ink-faint">
        인근 관광지·축제 불러오는 중…
      </div>
    );
  }

  const today = todayCompact();
  const visit = visitDate ? compact(visitDate) : null;
  // 방문일에 열리는 축제를 맨 앞으로
  const festivals = [...data.festivals].sort((a, b) => {
    const inA = !!visit && a.start_date <= visit && visit <= a.end_date;
    const inB = !!visit && b.start_date <= visit && visit <= b.end_date;
    return Number(inB) - Number(inA) || a.start_date.localeCompare(b.start_date);
  });

  if (festivals.length === 0 && data.spots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-4 text-sm text-ink-faint">
        이 지역의 관광지·축제 정보가 아직 없어요.
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2">
      {festivals.length > 0 && (
        <section>
          <h3 className="mb-2 font-bold">🎉 인근 축제</h3>
          <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
            {festivals.map((f) => {
              const badge = festivalBadge(f, today, visit);
              return (
                <a
                  key={f.content_id}
                  href={searchUrl(f.title)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-44 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-white"
                >
                  {f.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.image_url}
                      alt={f.title}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-clay-50 text-2xl">
                      🎪
                    </div>
                  )}
                  <div className="space-y-1 p-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <p className="line-clamp-2 text-sm font-semibold">
                      {f.title}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {formatRange(f.start_date, f.end_date)}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {data.spots.length > 0 && (
        <section>
          <h3 className="mb-2 font-bold">📍 인근 관광지</h3>
          <div className="space-y-2">
            {data.spots.map((s, i) => (
              <a
                key={s.content_id ?? i}
                href={searchUrl(s.title)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3"
              >
                {s.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image_url}
                    alt={s.title}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {s.title}
                    {s.category && (
                      <span className="ml-2 text-xs font-normal text-ink-faint">
                        {s.category}
                      </span>
                    )}
                  </p>
                  {(s.description || s.address) && (
                    <p className="truncate text-xs text-ink-soft">
                      {s.description || s.address}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <p className="text-[11px] text-ink-faint">
        {data.source === 'tourapi'
          ? '정보 제공: 한국관광공사 TourAPI'
          : '정보 제공: 전국관광지정보표준데이터'}
      </p>
    </div>
  );
}
