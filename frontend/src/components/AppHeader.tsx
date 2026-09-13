"use client";

import { useRouter } from "next/navigation";

const STAGES = ["발견", "체험", "관계"] as const;

export default function AppHeader({
  title,
  stage,
  showBack = true,
  onBack,
  right,
}: {
  title: string;
  stage?: (typeof STAGES)[number];
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-sand/95 backdrop-blur">
      {stage && (
        <div className="flex items-center gap-1.5 px-5 pt-4">
          {STAGES.map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 text-xs font-medium ${
                s === stage ? "text-clay-600" : "text-ink-faint"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${s === stage ? "bg-clay-500" : "bg-ink-faint/40"}`}
              />
              {s}
              {s !== "관계" && <span className="mx-0.5 text-ink-faint/50">→</span>}
            </div>
          ))}
        </div>
      )}
      <div className="flex h-14 items-center gap-2 px-3">
        {showBack ? (
          <button
            aria-label="뒤로가기"
            onClick={() => (onBack ? onBack() : router.back())}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-sand-dark"
          >
            ←
          </button>
        ) : (
          <div className="w-9" />
        )}
        <h1 className="flex-1 truncate text-base font-bold">{title}</h1>
        <div className="min-w-[2.25rem] text-right">{right}</div>
      </div>
    </header>
  );
}
