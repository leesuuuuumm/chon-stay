import { useEffect, useState } from "react";
import { extractErrorMessage, fetchHostBookings, type BookingStatus, type HostBooking } from "@/lib/api";
import { diffDays } from "@/lib/dates";
import { useAppStore } from "@/lib/store";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "승인 대기",
  approved: "승인 완료",
  rejected: "거절됨",
  cancelled: "취소됨",
};

export function bookingTitle(booking: HostBooking) {
  const first = booking.items[0]?.title ?? "예약";
  return booking.items.length > 1 ? `${first} 외 ${booking.items.length - 1}건` : first;
}

// 숙박이 있으면 "10월 5일 체크인 → 10월 8일 체크아웃 (3박)", 없으면 "방문일 10월 5일"
export function stayLabel(booking: { start_date: string; end_date: string }) {
  const nights = diffDays(booking.start_date, booking.end_date);
  if (nights <= 0) return `방문일 ${formatVisitDate(booking.start_date)}`;
  return `${formatVisitDate(booking.start_date)} 체크인 → ${formatVisitDate(booking.end_date)} 체크아웃 (${nights}박)`;
}

export function itemQuantityLabel(item: { type: string; quantity: number }) {
  if (item.type === "lodging") return ` · ${item.quantity}박`;
  return item.quantity > 1 ? ` × ${item.quantity}` : "";
}

export function formatVisitDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

// 서버가 UTC 기준 시각(타임존 표기 없음)을 내려주므로 날짜 부분만 사용한다.
export function formatRequestedDate(iso: string) {
  return formatVisitDate(iso.slice(0, 10));
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function useHostBookings() {
  const { hydrated, accessToken } = useAppStore();
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      setLoading(false);
      return;
    }
    fetchHostBookings(accessToken)
      .then(setBookings)
      .catch((err) => setError(extractErrorMessage(err, "예약 목록을 불러오지 못했어요.")))
      .finally(() => setLoading(false));
  }, [hydrated, accessToken]);

  return { hydrated, accessToken, bookings, setBookings, loading, error };
}
