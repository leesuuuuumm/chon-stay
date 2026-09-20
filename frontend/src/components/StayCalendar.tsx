"use client";

import { useMemo, useState } from "react";
import { addDays, diffDays } from "@/lib/dates";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_NIGHTS = 14;

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayLocalIso() {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

type Props = {
  checkIn: string | null;
  checkOut: string | null;
  /** 이미 예약된 '밤'(체크인 날짜 ~ 체크아웃 전날) */
  unavailable: Set<string>;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
};

export default function StayCalendar({ checkIn, checkOut, unavailable, onChange }: Props) {
  const today = todayLocalIso();
  const initial = checkIn ?? today;
  const [view, setView] = useState({
    year: Number(initial.slice(0, 4)),
    month: Number(initial.slice(5, 7)) - 1,
  });

  const selectingCheckOut = checkIn !== null && checkOut === null;

  // 체크인 날짜로 고를 수 있는 날: 지나지 않았고, 그날 밤이 비어 있어야 한다.
  const canCheckIn = (iso: string) => iso >= today && !unavailable.has(iso);

  // 체크아웃 날짜로 고를 수 있는 날: 체크인~그 전날 밤이 모두 비어 있어야 한다. (체크아웃 당일 밤은 상관없음)
  const canCheckOut = (iso: string) => {
    if (!checkIn || iso <= checkIn) return false;
    const nights = diffDays(checkIn, iso);
    if (nights > MAX_NIGHTS) return false;
    for (let i = 0; i < nights; i++) {
      if (unavailable.has(addDays(checkIn, i))) return false;
    }
    return true;
  };

  const handleClick = (iso: string) => {
    if (selectingCheckOut && canCheckOut(iso)) {
      onChange(checkIn, iso);
    } else if (canCheckIn(iso)) {
      onChange(iso, null);
    }
  };

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1).getDay();
    const days = new Date(view.year, view.month + 1, 0).getDate();
    return [
      ...Array.from({ length: first }, () => null),
      ...Array.from({ length: days }, (_, i) => toIso(view.year, view.month, i + 1)),
    ];
  }, [view]);

  const moveMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const isPrevDisabled = toIso(view.year, view.month, 1) <= today.slice(0, 8) + "01";
  const nights = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0;

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          disabled={isPrevDisabled}
          className="h-8 w-8 rounded-full border border-line text-sm disabled:opacity-30"
          aria-label="이전 달"
        >
          ‹
        </button>
        <p className="text-sm font-semibold">
          {view.year}년 {view.month + 1}월
        </p>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="h-8 w-8 rounded-full border border-line text-sm"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-ink-faint">
            {w}
          </div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`blank-${i}`} />;
          const past = iso < today;
          const booked = unavailable.has(iso);
          const isStart = iso === checkIn;
          const isEnd = iso === checkOut;
          const inRange = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;
          const clickable = selectingCheckOut ? canCheckOut(iso) || canCheckIn(iso) : canCheckIn(iso);
          // 이미 예약됐거나 지난 날짜는 연하게, 선택 불가로 표시한다. (체크아웃으로만 고를 수 있는 날은 제외)
          const dimmed = !clickable && !isStart && !isEnd;

          let cls = "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ";
          if (isStart || isEnd) cls += "bg-ink font-semibold text-white";
          else if (inRange) cls += "bg-clay-100 text-clay-700";
          else if (dimmed) cls += "cursor-not-allowed text-ink-faint/40";
          else cls += "hover:bg-sand-dark";
          if (booked && dimmed) cls += " bg-sand-dark line-through";

          return (
            <button
              key={iso}
              type="button"
              disabled={!clickable && !isStart && !isEnd}
              onClick={() => handleClick(iso)}
              title={booked ? "이미 예약된 날짜예요" : past ? "지난 날짜예요" : undefined}
              className={cls}
            >
              {Number(iso.slice(8, 10))}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-sand-dark" /> 예약 불가
        </span>
        <span>
          {checkIn && checkOut
            ? `${nights}박 선택됨`
            : selectingCheckOut
              ? "체크아웃 날짜를 선택하세요"
              : "체크인 날짜를 선택하세요"}
        </span>
      </div>
    </div>
  );
}
