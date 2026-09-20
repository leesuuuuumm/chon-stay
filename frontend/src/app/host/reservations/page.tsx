"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { decideHostBooking, extractErrorMessage, type HostBooking } from "@/lib/api";
import {
  STATUS_LABEL,
  formatRequestedDate,
  itemQuantityLabel,
  stayLabel,
  useHostBookings,
} from "@/lib/hostBookings";

export default function HostReservationsPage() {
  const { hydrated, accessToken, bookings, setBookings, loading, error } = useHostBookings();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const pending = bookings.filter((b) => b.status === "pending");
  const decided = bookings.filter((b) => b.status !== "pending");

  const decide = async (booking: HostBooking, decision: "approve" | "reject") => {
    if (!accessToken) return;
    setActionError(null);
    setBusyId(booking.id);
    try {
      const updated = await decideHostBooking(accessToken, booking.id, decision);
      setBookings((list) => list.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setActionError(extractErrorMessage(err, "처리에 실패했어요. 잠시 후 다시 시도해주세요."));
    } finally {
      setBusyId(null);
    }
  };

  const renderCard = (booking: HostBooking) => (
    <Card key={booking.id} className={booking.status === "rejected" || booking.status === "cancelled" ? "opacity-60" : ""}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">
          {booking.applicant_name} · {booking.headcount}인
        </p>
        <Badge tone={booking.status === "approved" ? "leaf" : "neutral"}>
          {STATUS_LABEL[booking.status]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{stayLabel(booking)}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {booking.items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-2">
            <span>
              <span className="mr-1.5 text-xs text-ink-faint">
                {item.type === "experience" ? "체험" : "숙박"}
              </span>
              {item.title}
              {itemQuantityLabel(item)}
            </span>
            <span className="text-ink-soft">{item.subtotal.toLocaleString()}원</span>
          </li>
        ))}
      </ul>
      {booking.discount_amount > 0 && (
        <p className="mt-2 flex items-center justify-between text-sm text-clay-600">
          <span>쿠폰 할인</span>
          <span>-{booking.discount_amount.toLocaleString()}원</span>
        </p>
      )}
      <p className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm font-semibold">
        <span>합계</span>
        <span>{booking.total_price.toLocaleString()}원</span>
      </p>
      <p className="mt-1 text-xs text-ink-faint">신청일 {formatRequestedDate(booking.requested_at)}</p>
      {booking.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            disabled={busyId === booking.id}
            onClick={() => decide(booking, "approve")}
            className="h-10 flex-1 rounded-lg bg-ink text-sm font-semibold text-white disabled:opacity-50"
          >
            승인
          </button>
          <button
            disabled={busyId === booking.id}
            onClick={() => decide(booking, "reject")}
            className="h-10 flex-1 rounded-lg border border-line text-sm font-semibold text-ink-soft disabled:opacity-50"
          >
            거절
          </button>
        </div>
      )}
    </Card>
  );

  let content: React.ReactNode;
  if (!hydrated || loading) {
    content = <p className="py-10 text-center text-sm text-ink-faint">불러오는 중...</p>;
  } else if (!accessToken) {
    content = (
      <p className="py-10 text-center text-sm text-ink-soft">
        <Link href="/login?redirect=/host/reservations" className="font-semibold underline">
          로그인
        </Link>
        이 필요해요.
      </p>
    );
  } else if (error) {
    content = <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>;
  } else if (bookings.length === 0) {
    content = (
      <p className="py-10 text-center text-sm text-ink-faint">아직 들어온 예약 신청이 없어요.</p>
    );
  } else {
    content = (
      <>
        {actionError && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</p>
        )}
        {pending.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">{pending.map(renderCard)}</div>
        )}
        {decided.length > 0 && (
          <>
            <p className="pt-2 text-sm font-semibold text-ink-soft">처리 완료</p>
            <div className="grid gap-3 md:grid-cols-2 md:gap-4">{decided.map(renderCard)}</div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <AppHeader title="예약 승인/거절 관리" />
      <div className="space-y-4 px-5 py-5 md:px-8 md:py-8">
        <h2 className="text-lg font-bold md:text-xl">예약 신청 {pending.length}</h2>
        {content}
      </div>
    </>
  );
}
