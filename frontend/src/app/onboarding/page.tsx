"use client";

import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import { INTERESTS, DURATIONS } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";

export default function OnboardingPage() {
  const router = useRouter();
  const { interests, toggleInterest, duration, setDuration } = useAppStore();

  return (
    <Shell>
      <AppHeader title="온보딩 · 관심사 선택" stage="발견" showBack={false} />
      <div className="flex flex-1 flex-col px-5 py-6">
        <h2 className="text-2xl font-bold leading-snug">
          어떤 촌 경험을
          <br />
          찾고 계세요?
        </h2>

        <p className="mt-8 text-sm font-semibold text-ink-soft">관심사 (복수 선택)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <Chip
              key={interest}
              active={interests.includes(interest)}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Chip>
          ))}
        </div>

        <p className="mt-8 text-sm font-semibold text-ink-soft">체류 기간</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <Chip
              key={d}
              active={duration === d}
              onClick={() => setDuration(d)}
              className="justify-center"
            >
              {d}
            </Chip>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-4 pt-10">
          <Button onClick={() => router.push("/villages")}>추천 받기</Button>
          <button
            onClick={() => router.push("/villages")}
            className="text-sm text-ink-faint underline underline-offset-2"
          >
            로그인 없이 둘러보기
          </button>
        </div>
      </div>
    </Shell>
  );
}
