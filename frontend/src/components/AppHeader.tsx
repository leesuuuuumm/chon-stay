"use client";

import { useRouter } from "next/navigation";

export default function AppHeader({
  title,
  showBack = true,
  onBack,
  right,
}: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-sand/95 backdrop-blur md:static md:bg-transparent md:backdrop-blur-none">
      <div
        className={`flex h-14 items-center gap-2 md:h-16 md:px-8 ${showBack ? "px-3" : "px-5"}`}
      >
        {showBack ? (
          <button
            aria-label="뒤로가기"
            onClick={() => (onBack ? onBack() : router.back())}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-sand-dark"
          >
            ←
          </button>
        ) : null}
        <h1 className="flex-1 truncate text-base font-bold md:text-lg">{title}</h1>
        <div className="min-w-[2.25rem] text-right">{right}</div>
      </div>
    </header>
  );
}
