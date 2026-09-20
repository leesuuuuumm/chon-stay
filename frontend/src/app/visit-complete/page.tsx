"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/ui/Button";
import { getVillageDetail } from "@/lib/api";
import { useAppStore } from "@/lib/store";

function VisitCompleteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const villageId = params.get("village") ?? "";
  const [villageName, setVillageName] = useState<string | null>(null);
  const village = { id: villageId, name: villageName ?? "마을" };
  const { subscribeVillage, subscribedVillageIds } = useAppStore();

  useEffect(() => {
    if (!villageId) return;
    getVillageDetail(Number(villageId))
      .then((detail) => setVillageName(detail.name))
      .catch(() => setVillageName(null));
  }, [villageId]);
  const [subscribed, setSubscribed] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewText, setReviewText] = useState("");

  const alreadySubscribed = subscribed || subscribedVillageIds.includes(village.id);

  return (
    <Shell>
      <AppHeader title="예약 신청 완료" stage="관계" showBack={false} />
      <div className="flex flex-1 flex-col items-center px-6 py-10 text-center md:my-6 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-14 md:shadow-card">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="mt-6 text-2xl font-bold">예약 신청 완료!</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {village.name}에 예약을 신청했어요
          <br />
          마을에서 승인하면 예약이 확정돼요
        </p>

        <div className="mt-10 w-full space-y-3">
          <Button
            variant={alreadySubscribed ? "outline" : "primary"}
            onClick={() => {
              subscribeVillage(village.id);
              setSubscribed(true);
            }}
          >
            {alreadySubscribed ? "관계를 맺었어요 ♡" : `${village.name}과 관계 맺기 ♡`}
          </Button>
          {alreadySubscribed && (
            <p className="text-xs text-ink-faint">마을 소식 구독을 시작합니다</p>
          )}

          {!showReview && !reviewSent && (
            <button
              onClick={() => setShowReview(true)}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-line bg-white text-sm font-semibold text-ink-soft"
            >
              리뷰 남기기
            </button>
          )}
          {showReview && !reviewSent && (
            <div className="rounded-xl border border-line bg-white p-3 text-left">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="이번 체류는 어떠셨나요?"
                className="h-20 w-full resize-none text-sm outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  disabled={!reviewText.trim()}
                  onClick={() => setReviewSent(true)}
                  className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white disabled:bg-ink/30"
                >
                  등록
                </button>
              </div>
            </div>
          )}
          {reviewSent && <p className="text-xs text-leaf-600">리뷰가 등록되었어요. 감사합니다!</p>}
        </div>

        <button
          onClick={() => router.push("/mypage")}
          className="mt-10 text-sm text-ink-faint underline underline-offset-2"
        >
          내 예약 확인하기
        </button>
      </div>
    </Shell>
  );
}

export default function VisitCompletePage() {
  return (
    <Suspense fallback={null}>
      <VisitCompleteContent />
    </Suspense>
  );
}
