"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import { getVillageDetail } from "@/lib/api";

function VisitCompleteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const villageId = params.get("village") ?? "";
  const [villageName, setVillageName] = useState<string | null>(null);
  const village = { id: villageId, name: villageName ?? "마을" };

  useEffect(() => {
    if (!villageId) return;
    getVillageDetail(Number(villageId))
      .then((detail) => setVillageName(detail.name))
      .catch(() => setVillageName(null));
  }, [villageId]);

  return (
    <Shell>
      <AppHeader title="예약 신청 완료" onBack={() => router.push("/mypage")} />
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
