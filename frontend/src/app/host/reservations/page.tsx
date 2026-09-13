"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/ui/Card";
import { HOST_RESERVATIONS, type ReservationRequest } from "@/lib/mockData";

export default function HostReservationsPage() {
  const [requests, setRequests] = useState<ReservationRequest[]>(HOST_RESERVATIONS);
  const pending = requests.filter((r) => r.status === "pending");

  const decide = (id: string, status: "approved" | "rejected") =>
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));

  return (
    <>
      <AppHeader title="예약 승인/거절 관리" showBack={false} />
      <div className="space-y-3 px-5 py-5">
        <h2 className="text-lg font-bold">예약 신청 {pending.length}</h2>

        {requests.map((req) => (
          <Card key={req.id} className={req.status !== "pending" ? "opacity-60" : ""}>
            <p className="font-semibold">
              {req.applicant} · {req.people}인
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {req.detail}
              {req.capacityNote ? ` · ${req.capacityNote}` : ""}
            </p>
            {req.status === "pending" ? (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => decide(req.id, "approved")}
                  className="h-10 flex-1 rounded-lg bg-ink text-sm font-semibold text-white"
                >
                  승인
                </button>
                <button
                  onClick={() => decide(req.id, "rejected")}
                  className="h-10 flex-1 rounded-lg border border-line text-sm font-semibold text-ink-soft"
                >
                  거절
                </button>
              </div>
            ) : (
              <p className="mt-3 text-xs font-semibold text-ink-faint">
                {req.status === "approved" ? "승인 완료 · 사용자에게 알림 전송됨" : "거절됨"}
              </p>
            )}
          </Card>
        ))}

        <p className="pt-4 text-center text-xs text-ink-faint">
          정원 초과 시 자동 마감 · 승인 시 사용자에게 확정 알림
        </p>
      </div>
    </>
  );
}
