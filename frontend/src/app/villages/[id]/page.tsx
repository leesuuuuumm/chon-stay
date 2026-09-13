"use client";

import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getVillage } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";

const TABS = ["체험", "숙박", "캘린더", "소식"] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return !!value && (TABS as readonly string[]).includes(value);
}

function VillageDetailContent({ params }: { params: { id: string } }) {
  const village = getVillage(params.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, addToCart, removeFromCart } = useAppStore();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(isTab(initialTab) ? initialTab : "체험");

  if (!village) return notFound();

  const villageCartItems = cart.filter((c) => c.villageId === village.id);
  const cartCount = villageCartItems.length;
  const cartTotal = villageCartItems.reduce((sum, item) => sum + item.price, 0);

  const autoRecommend = () => {
    const exp = village.experiences[0];
    if (exp) {
      addToCart({
        id: exp.id,
        villageId: village.id,
        villageName: village.name,
        type: "experience",
        title: exp.title,
        meta: exp.season,
        price: exp.price,
      });
    }
    const lodge = village.lodgings[0];
    if (lodge) {
      addToCart({
        id: lodge.id,
        villageId: village.id,
        villageName: village.name,
        type: "lodging",
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
          <PhotoPlaceholder label="village hero" className="h-44 md:h-64 lg:h-80 lg:rounded-2xl" />

          <div className="px-5 py-4 md:px-8 lg:px-0">
            <h2 className="text-xl font-bold md:text-2xl">{village.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">{village.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {village.interestTags.map((t) => (
                <Badge key={t} tone="leaf">
                  {t}
                </Badge>
              ))}
              {village.urgencyLabel && <Badge tone="clay">{village.urgencyLabel}</Badge>}
            </div>
          </div>

          <div className="flex gap-5 border-b border-line px-5 md:px-8 lg:px-0">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative pb-3 text-sm font-semibold ${
                  tab === t ? "text-ink" : "text-ink-faint"
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
            {tab === "체험" && (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  {village.experiences.map((exp) => {
                    const inCart = cart.some((c) => c.id === exp.id);
                    return (
                      <Card key={exp.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{exp.title}</p>
                          <p className="text-sm text-ink-soft">
                            {exp.season} · {exp.price.toLocaleString()}원
                          </p>
                        </div>
                        <Button
                          variant={inCart ? "outline" : "primary"}
                          size="md"
                          fullWidth={false}
                          className="shrink-0 px-4"
                          disabled={inCart}
                          onClick={() =>
                            addToCart({
                              id: exp.id,
                              villageId: village.id,
                              villageName: village.name,
                              type: "experience",
                              title: exp.title,
                              meta: exp.season,
                              price: exp.price,
                            })
                          }
                        >
                          {inCart ? "담김" : "담기"}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
                {village.tourSpots.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-ink-faint">인근 관광지·축제 (TourAPI)</p>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-1">
                      {village.tourSpots.map((spot) => (
                        <div
                          key={spot.id}
                          className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-soft"
                        >
                          {spot.title} · {spot.category}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "숙박" &&
              (village.lodgings.length ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  {village.lodgings.map((lodge) => {
                    const inCart = cart.some((c) => c.id === lodge.id);
                    return (
                      <Card key={lodge.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{lodge.title}</p>
                          <p className="text-sm text-ink-soft">
                            {lodge.unit} · {lodge.price.toLocaleString()}원
                          </p>
                        </div>
                        <Button
                          variant={inCart ? "outline" : "primary"}
                          size="md"
                          fullWidth={false}
                          className="shrink-0 px-4"
                          disabled={inCart}
                          onClick={() =>
                            addToCart({
                              id: lodge.id,
                              villageId: village.id,
                              villageName: village.name,
                              type: "lodging",
                              title: lodge.title,
                              meta: lodge.unit,
                              price: lodge.price,
                            })
                          }
                        >
                          {inCart ? "담김" : "담기"}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-ink-faint">등록된 숙박이 없어요.</p>
              ))}

            {tab === "캘린더" &&
              (village.calendar.length ? (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-1">
                  {village.calendar.map((c) => (
                    <Card key={c.date} className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{c.date}</span>
                      <span className="text-sm text-ink-soft">{c.label}</span>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-ink-faint">예정된 일정이 없어요.</p>
              ))}

            {tab === "소식" && (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  {village.notices.map((n) => (
                    <Card key={n.id}>
                      <p className="text-sm font-semibold">{n.author}</p>
                      <p className="mt-1 text-sm text-ink-soft">{n.content}</p>
                      <p className="mt-2 text-xs text-ink-faint">{n.createdAt}</p>
                    </Card>
                  ))}
                  {village.reviews.map((r) => (
                    <Card key={r.id}>
                      <p className="text-sm font-semibold">
                        {"★".repeat(r.rating)} · {r.author}
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">{r.content}</p>
                      {r.reply && (
                        <p className="mt-2 rounded-lg bg-sand-dark px-3 py-2 text-xs text-ink-soft">
                          ↳ {r.reply}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
                {!village.notices.length && !village.reviews.length && (
                  <p className="py-8 text-center text-sm text-ink-faint">아직 소식이 없어요.</p>
                )}
              </>
            )}
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <Card>
            <p className="font-bold">{village.name}</p>
            {cartCount > 0 ? (
              <>
                <div className="mt-3 space-y-2">
                  {villageCartItems.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-ink-faint">{item.price.toLocaleString()}원</p>
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
                <Button className="mt-3" onClick={() => router.push("/reservation")}>
                  예약하러 가기
                </Button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-ink-soft">체험·숙박을 담으면 여기에 모여요.</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    autoRecommend();
                    router.push("/reservation");
                  }}
                >
                  자동 코스 추천
                </Button>
                <Button variant="ghost" className="mt-2" onClick={() => setTab("체험")}>
                  ✎ 커스터마이징
                </Button>
              </>
            )}
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-line bg-sand px-5 py-3 lg:hidden">
        {cartCount > 0 ? (
          <Button onClick={() => router.push("/reservation")}>
            {cartCount}개 담김 · 예약하러 가기
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-[1.4]"
              onClick={() => {
                autoRecommend();
                router.push("/reservation");
              }}
            >
              자동 코스 추천
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setTab("체험")}>
              ✎ 커스터마이징
            </Button>
          </>
        )}
      </div>
    </Shell>
  );
}

export default function VillageDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={null}>
      <VillageDetailContent params={params} />
    </Suspense>
  );
}
