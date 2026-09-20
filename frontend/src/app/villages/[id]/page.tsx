'use client';

import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import Shell from '@/components/Shell';
import AppHeader from '@/components/AppHeader';
import PhotoPlaceholder from '@/components/PhotoPlaceholder';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getVillageDetail, extractErrorMessage } from '@/lib/api';
import type { VillageDetail } from '@/lib/api';
import { useAppStore } from '@/lib/store';

type Tab = '체험' | '숙박';

function formatShortDate(iso: string) {
  const [, month, day] = iso.split('-');
  return `${Number(month)}/${Number(day)}`;
}

function VillageDetailContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    cart,
    addToCart,
    removeFromCart,
    duration,
    visitDate,
    setVisitDate,
    hydrated,
  } = useAppStore();
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const [notice, setNotice] = useState<string | null>(null);

  const [headcounts, setHeadcounts] = useState<Record<string, number>>({});
  const TABS: Tab[] = duration === '당일' ? ['체험'] : ['체험', '숙박'];

  const isTab = (value: string | null): value is Tab =>
    !!value && (TABS as string[]).includes(value);

  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<Tab>(isTab(initialTab) ? initialTab : '체험');
  const [village, setVillage] = useState<VillageDetail | null>(null);
  const getHeadcount = (itemId: string) => headcounts[itemId] || 1;
  const setHeadcount = (itemId: string, value: number) =>
    setHeadcounts((h) => ({ ...h, [itemId]: Math.max(1, value) }));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVillageDetail(Number(params.id))
      .then(setVillage)
      .catch((err) =>
        setError(extractErrorMessage(err, '마을 정보를 불러오지 못했어요.')),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  const isOperating = (exp: { start_date: string; end_date: string }) =>
    !visitDate || (exp.start_date <= visitDate && visitDate <= exp.end_date);

  // 방문 날짜를 바꾸면, 그 날짜에 운영하지 않는 체험은 장바구니에서 뺀다.
  useEffect(() => {
    if (!hydrated || !village || !visitDate) return;
    const operatingIds = new Set(
      village.experiences
        .filter((e) => e.start_date <= visitDate && visitDate <= e.end_date)
        .map((e) => String(e.id)),
    );
    const stale = cartRef.current.filter(
      (c) =>
        c.villageId === String(village.id) &&
        c.type === 'experience' &&
        !operatingIds.has(c.id),
    );
    if (stale.length === 0) return;
    stale.forEach((c) => removeFromCart(c.id));
    setNotice(
      `선택한 날짜에 운영하지 않는 체험 ${stale.length}개를 장바구니에서 뺐어요.`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [village, visitDate, hydrated]);

  if (loading) {
    return (
      <Shell>
        <AppHeader title="마을 상세" />
        <p className="px-5 py-10 text-center text-sm text-ink-faint">
          불러오는 중...
        </p>
      </Shell>
    );
  }

  if (error || !village) return notFound();

  const villageCartItems = cart.filter(
    (c) => c.villageId === String(village.id),
  );
  const cartCount = villageCartItems.length;
  const cartTotal = villageCartItems.reduce((sum, item) => sum + item.price, 0);

  const autoRecommend = () => {
    const exp = village.experiences[0];
    if (exp) {
      addToCart({
        id: String(exp.id),
        villageId: String(village.id),
        villageName: village.name,
        type: 'experience',
        title: exp.title,
        meta: exp.season || '',
        price: exp.price,
      });
    }
    const lodge = village.lodgings[0];
    if (lodge) {
      addToCart({
        id: String(lodge.id),
        villageId: String(village.id),
        villageName: village.name,
        type: 'lodging',
        title: lodge.title,
        meta: lodge.unit,
        price: lodge.price,
      });
    }
  };

  return (
    <Shell withBottomPadding size="wide">
      <AppHeader title={village.name} stage="체험" />

      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8 lg:px-8 lg:py-8">
        <div className="min-w-0">
          <PhotoPlaceholder
            label="village hero"
            className="h-44 md:h-64 lg:h-80 lg:rounded-2xl"
          />

          <div className="px-5 py-4 md:px-8 lg:px-0">
            <h2 className="text-xl font-bold md:text-2xl">{village.name}</h2>
            {village.description && (
              <p className="mt-1 text-sm text-ink-soft">
                {village.description}
              </p>
            )}
            <div className="mt-3">
              <label className="mb-1 block text-sm font-semibold text-ink-soft">
                방문 날짜
              </label>
              <input
                type="date"
                value={visitDate || ''}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setNotice(null);
                  setVisitDate(e.target.value);
                }}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink md:w-64"
              />
              {notice && (
                <p className="mt-2 rounded-lg bg-clay-100 px-3 py-2 text-xs text-clay-700">
                  {notice}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-5 border-b border-line px-5 md:px-8 lg:px-0">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative pb-3 text-sm font-semibold ${
                  tab === t ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                {t}
                {tab === t && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ink" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3 px-5 py-4 md:px-8 lg:px-0">
            {tab === '체험' &&
              (village.experiences.length ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  {village.experiences.map((exp) => {
                    const itemId = String(exp.id);
                    const inCart = cart.some((c) => c.id === itemId);
                    const hc = getHeadcount(itemId);
                    const operating = isOperating(exp);
                    return (
                      <Card
                        key={exp.id}
                        className={`space-y-2 ${operating ? '' : 'opacity-60'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{exp.title}</p>
                            <p className="text-sm text-ink-soft">
                              {exp.season ? `${exp.season} · ` : ''}
                              {exp.price.toLocaleString()}원 · 정원{' '}
                              {exp.capacity}명
                            </p>
                            <p className="text-xs text-ink-faint">
                              운영 {formatShortDate(exp.start_date)} ~{' '}
                              {formatShortDate(exp.end_date)}
                              {!operating && ' · 선택한 날짜에는 운영하지 않아요'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-ink-soft">인원</span>
                            <input
                              type="number"
                              min={1}
                              max={exp.capacity}
                              value={hc}
                              onChange={(e) =>
                                setHeadcount(itemId, Number(e.target.value))
                              }
                              className="w-16 rounded-lg border border-line px-2 py-1 text-sm"
                              disabled={inCart}
                            />
                            <span className="text-sm font-semibold">
                              {(exp.price * hc).toLocaleString()}원
                            </span>
                          </div>
                          <Button
                            variant={inCart ? 'outline' : 'primary'}
                            size="md"
                            fullWidth={false}
                            className="shrink-0 px-4"
                            disabled={inCart || !visitDate || !operating}
                            onClick={() =>
                              addToCart({
                                id: itemId,
                                villageId: String(village.id),
                                villageName: village.name,
                                type: 'experience',
                                title: `${exp.title} · ${hc}인`,
                                meta: exp.season || '',
                                price: exp.price * hc,
                              })
                            }
                          >
                            {inCart
                              ? '담김'
                              : !visitDate
                                ? '날짜 먼저 선택'
                                : !operating
                                  ? '운영 기간 아님'
                                  : '담기'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-ink-faint">
                  등록된 체험이 없어요.
                </p>
              ))}

            {tab === '숙박' &&
              (village.lodgings.length ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  {village.lodgings.map((lodge) => {
                    const itemId = String(lodge.id);
                    const inCart = cart.some((c) => c.id === itemId);
                    const hc = getHeadcount(itemId);
                    return (
                      <Card key={lodge.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{lodge.title}</p>
                            <p className="text-sm text-ink-soft">
                              {lodge.unit} · {lodge.price.toLocaleString()}원 ·
                              최대 {lodge.capacity}인
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-ink-soft">인원</span>
                            <input
                              type="number"
                              min={1}
                              max={lodge.capacity}
                              value={hc}
                              onChange={(e) =>
                                setHeadcount(itemId, Number(e.target.value))
                              }
                              className="w-16 rounded-lg border border-line px-2 py-1 text-sm"
                              disabled={inCart}
                            />
                            <span className="text-sm font-semibold">
                              {(lodge.price * hc).toLocaleString()}원
                            </span>
                          </div>
                          <Button
                            variant={inCart ? 'outline' : 'primary'}
                            size="md"
                            fullWidth={false}
                            className="shrink-0 px-4"
                            disabled={inCart || !visitDate}
                            onClick={() =>
                              addToCart({
                                id: itemId,
                                villageId: String(village.id),
                                villageName: village.name,
                                type: 'lodging',
                                title: `${lodge.title} · ${hc}인`,
                                meta: lodge.unit,
                                price: lodge.price * hc,
                              })
                            }
                          >
                            {inCart
                              ? '담김'
                              : !visitDate
                                ? '날짜 먼저 선택'
                                : '담기'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-ink-faint">
                  등록된 숙박이 없어요.
                </p>
              ))}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <Card>
            <p className="font-bold">{village.name}</p>
            {cartCount > 0 ? (
              <>
                <div className="mt-3 space-y-2">
                  {villageCartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-ink-faint">
                          {item.price.toLocaleString()}원
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="shrink-0 text-xs text-ink-faint underline underline-offset-2"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm font-semibold">
                  <span>합계</span>
                  <span>{cartTotal.toLocaleString()}원</span>
                </div>
                <Button
                  className="mt-3"
                  onClick={() => router.push('/reservation')}
                >
                  예약하러 가기
                </Button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-ink-soft">
                  체험·숙박을 담으면 여기에 모여요.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    autoRecommend();
                    router.push('/reservation');
                  }}
                >
                  자동 코스 추천
                </Button>
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setTab('체험')}
                >
                  ✎ 커스터마이징
                </Button>
              </>
            )}
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-line bg-sand px-5 py-3 lg:hidden">
        {cartCount > 0 ? (
          <Button onClick={() => router.push('/reservation')}>
            {cartCount}개 담김 · 예약하러 가기
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-[1.4]"
              onClick={() => {
                autoRecommend();
                router.push('/reservation');
              }}
            >
              자동 코스 추천
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setTab('체험')}
            >
              ✎ 커스터마이징
            </Button>
          </>
        )}
      </div>
    </Shell>
  );
}

export default function VillageDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={null}>
      <VillageDetailContent params={params} />
    </Suspense>
  );
}
