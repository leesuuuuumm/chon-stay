"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import DesktopSectionNav from "@/components/DesktopSectionNav";
import AuthNavStatus from "@/components/AuthNavStatus";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { ReviewFormModal, Stars } from "@/components/ReviewModals";
import { getVillage } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";
import {
  extractErrorMessage,
  fetchHostBookings,
  cancelMyBooking,
  createReview,
  deleteReview,
  updateReview,
  fetchMyBookings,
  fetchMyCoupons,
  fetchMyVillageApplication,
  type BookingStatus,
  type Coupon,
  type CouponStatus,
  type HostBooking,
  type MyBooking,
  type MyBookingItem,
  type VillageApplication,
} from "@/lib/api";
import { formatKstDate, formatMonthDay } from "@/lib/dates";
import { STATUS_LABEL, formatRequestedDate, itemQuantityLabel, lodgingCheckout, stayLabel, todayIso } from "@/lib/hostBookings";

const COUPON_STATUS_TEXT: Record<CouponStatus, string> = {
  available: "사용 가능",
  used: "사용 완료",
  expired: "기간 만료",
};

const NAV_ITEMS = [
  { href: "/villages", label: "마을 찾기" },
  { href: "/mypage", label: "마이페이지" },
];

const VILLAGE_STATUS_TEXT: Record<VillageApplication["status"], string> = {
  pending: "대표자 서류를 검토중이에요 (1~2일 소요)",
  approved: "대표자 인증이 승인됐어요",
  rejected: "대표자 인증이 거절됐어요. 서류를 다시 확인해 재신청해주세요.",
};

const MY_BOOKING_STATUS_TEXT: Record<BookingStatus, string> = {
  pending: "승인 대기",
  approved: "예약 확정",
  rejected: "거절됨",
  cancelled: "취소됨",
};

export default function MyPage() {
  const { subscribedVillageIds, lastVisitedVillageId, user, accessToken } = useAppStore();
  const [showCoupons, setShowCoupons] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const [villageApplication, setVillageApplication] = useState<VillageApplication | null>(null);

  const [hostBookings, setHostBookings] = useState<HostBooking[] | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  useEffect(() => {
    if (!accessToken) return;
    fetchMyCoupons(accessToken)
      .then(setCoupons)
      .catch((err) => setCouponsError(extractErrorMessage(err, "쿠폰을 불러오지 못했어요.")));
  }, [accessToken]);

  const availableCouponCount = coupons?.filter((c) => c.status === "available").length ?? 0;

  const [myBookings, setMyBookings] = useState<MyBooking[] | null>(null);
  const [myBookingsError, setMyBookingsError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // 리뷰 쓰기 창에 띄울 예약 항목
  const [reviewTarget, setReviewTarget] = useState<{ bookingId: number; item: MyBookingItem } | null>(null);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!accessToken || !reviewTarget) return;
    const { bookingId, item } = reviewTarget;
    // 이미 쓴 리뷰가 있으면 수정, 없으면 새로 등록
    const review = item.review
      ? await updateReview(accessToken, item.review.id, { rating, comment })
      : await createReview(accessToken, { booking_item_id: item.id, rating, comment });
    setMyBookings(
      (list) =>
        list?.map((b) =>
          b.id === bookingId
            ? { ...b, items: b.items.map((i) => (i.id === item.id ? { ...i, can_review: false, review } : i)) }
            : b,
        ) ?? null,
    );
    setReviewTarget(null);
  };

  const handleReviewDelete = async (item: MyBookingItem) => {
    if (!accessToken || !item.review) return;
    if (!window.confirm("리뷰를 삭제할까요?")) return;
    setCancelError(null);
    try {
      await deleteReview(accessToken, item.review.id);
      // 삭제하면 다시 리뷰를 쓸 수 있으므로 서버 기준으로 목록을 새로 받는다.
      setMyBookings(await fetchMyBookings(accessToken));
    } catch (err) {
      setCancelError(extractErrorMessage(err, "리뷰를 삭제하지 못했어요."));
    }
  };

  const handleCancel = async (b: MyBooking) => {
    if (!accessToken) return;
    const hasLodging = b.items.some((i) => i.type === "lodging");
    const message = hasLodging
      ? "예약을 취소할까요?\n취소하면 체크아웃일에 발급되는 숙박 쿠폰도 받을 수 없어요."
      : "예약을 취소할까요?";
    if (!window.confirm(message)) return;
    setCancelError(null);
    setCancellingId(b.id);
    try {
      const updated = await cancelMyBooking(accessToken, b.id);
      setMyBookings((list) => list?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
      fetchMyCoupons(accessToken).then(setCoupons).catch(() => {});
    } catch (err) {
      setCancelError(extractErrorMessage(err, "예약을 취소하지 못했어요."));
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchMyBookings(accessToken)
      .then(setMyBookings)
      .catch((err) => setMyBookingsError(extractErrorMessage(err, "내 예약 내역을 불러오지 못했어요.")));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyVillageApplication(accessToken).then(setVillageApplication).catch(() => {});
  }, [accessToken]);

  const isApprovedHost = villageApplication?.status === "approved";
  useEffect(() => {
    if (!accessToken || !isApprovedHost) return;
    fetchHostBookings(accessToken)
      .then(setHostBookings)
      .catch((err) => setBookingsError(extractErrorMessage(err, "예약 내역을 불러오지 못했어요.")));
  }, [accessToken, isApprovedHost]);

  const pendingCount = hostBookings?.filter((b) => b.status === "pending").length ?? 0;

  const subscribed = subscribedVillageIds.map((id) => getVillage(id)).filter(Boolean);
  const lastVillage = lastVisitedVillageId ? getVillage(lastVisitedVillageId) : null;

  return (
    <>
      <DesktopSectionNav items={NAV_ITEMS} right={<AuthNavStatus />} />
      <Shell withBottomPadding size="wide">
        <AppHeader title="내 마을" stage="관계" showBack={false} />
        <div className="flex-1 space-y-5 px-5 py-5 md:px-8 lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-8 lg:space-y-0">
          <div className="space-y-5">
            {!user && (
              <div className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 md:hidden">
                <p className="text-sm text-ink-soft">로그인하면 다른 기기에서도 확인할 수 있어요</p>
                <Link href="/login" className="shrink-0 text-sm font-semibold underline underline-offset-2">
                  로그인
                </Link>
              </div>
            )}
            {villageApplication && (
              <Card className="space-y-2">
                <p className="text-sm font-semibold">마을 대표자 신청 현황</p>
                <p className="text-sm text-ink-soft">
                  {villageApplication.representative_name}님 · {VILLAGE_STATUS_TEXT[villageApplication.status]}
                </p>
                {villageApplication.status === "approved" && (
                  <Link
                    href="/host/onboarding"
                    className="inline-block text-sm font-semibold text-clay-600 underline underline-offset-2"
                  >
                    마을·체험·숙소 정보 수정하기
                  </Link>
                )}
              </Card>
            )}

            {isApprovedHost && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-soft">
                    우리 마을에 들어온 예약
                    {pendingCount > 0 && (
                      <span className="ml-2 text-clay-600">승인 대기 {pendingCount}건</span>
                    )}
                  </p>
                  <Link href="/host/reservations" className="text-xs text-ink-faint underline">
                    예약 관리
                  </Link>
                </div>
                {bookingsError ? (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{bookingsError}</p>
                ) : hostBookings === null ? (
                  <p className="text-sm text-ink-faint">불러오는 중...</p>
                ) : hostBookings.length === 0 ? (
                  <Card className="py-6 text-center text-sm text-ink-faint">
                    아직 들어온 예약이 없어요.
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {hostBookings.slice(0, 5).map((b) => (
                      <Card key={b.id} className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {b.applicant_name} · {b.headcount}인
                          </p>
                          <Badge tone={b.status === "approved" ? "leaf" : "neutral"}>
                            {STATUS_LABEL[b.status]}
                          </Badge>
                        </div>
                        <ul className="space-y-0.5 text-sm text-ink-soft">
                          {b.items.map((item, i) => (
                            <li key={i} className="flex justify-between gap-2">
                              <span>
                                <span className="mr-1.5 text-xs text-ink-faint">
                                  {item.type === "experience" ? "체험" : "숙박"}
                                </span>
                                {item.title}
                                {itemQuantityLabel(item)}
                              </span>
                              <span>{item.subtotal.toLocaleString()}원</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-ink-faint">
                          {stayLabel(b)} · 신청 {formatRequestedDate(b.requested_at)} · 합계{" "}
                          {b.total_price.toLocaleString()}원
                          {b.discount_amount > 0 && ` (쿠폰 -${b.discount_amount.toLocaleString()}원)`}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {accessToken && (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink-soft">내 예약</p>
                {cancelError && (
                  <p className="mb-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{cancelError}</p>
                )}
                {myBookingsError ? (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{myBookingsError}</p>
                ) : myBookings === null ? (
                  <p className="text-sm text-ink-faint">불러오는 중...</p>
                ) : myBookings.length === 0 ? (
                  <Card className="py-6 text-center text-sm text-ink-faint">
                    아직 예약한 내역이 없어요.
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {myBookings.map((b) => (
                      <Card key={b.id} className={`space-y-1.5 ${b.status === "rejected" || b.status === "cancelled" ? "opacity-60" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{b.village_name ?? "마을"}</p>
                          <Badge tone={b.status === "approved" ? "leaf" : "neutral"}>
                            {MY_BOOKING_STATUS_TEXT[b.status]}
                          </Badge>
                        </div>
                        <ul className="space-y-1.5 text-sm text-ink-soft">
                          {b.items.map((item) => (
                            <li key={item.id}>
                              <div className="flex justify-between gap-2">
                                <span>
                                  <span className="mr-1.5 text-xs text-ink-faint">
                                    {item.type === "experience" ? "체험" : "숙박"}
                                  </span>
                                  {item.title}
                                  {itemQuantityLabel(item)}
                                </span>
                                <span>{item.subtotal.toLocaleString()}원</span>
                              </div>
                              {item.can_review && (
                                <button
                                  onClick={() => setReviewTarget({ bookingId: b.id, item })}
                                  className="mt-1 rounded-lg border border-clay-300 bg-clay-50 px-3 py-1.5 text-xs font-semibold text-clay-700"
                                >
                                  {item.type === "experience" ? "체험 리뷰쓰기" : "숙박 리뷰쓰기"}
                                </button>
                              )}
                              {item.review && (
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
                                  <Stars rating={item.review.rating} />
                                  <span className="min-w-0 flex-1 truncate">{item.review.comment}</span>
                                  <button
                                    onClick={() => setReviewTarget({ bookingId: b.id, item })}
                                    className="shrink-0 underline"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleReviewDelete(item)}
                                    className="shrink-0 underline"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-ink-faint">
                          {stayLabel(b)} · {b.headcount}인 · 합계{" "}
                          {b.total_price.toLocaleString()}원
                          {b.discount_amount > 0 && ` (쿠폰 -${b.discount_amount.toLocaleString()}원)`}
                          {b.status === "approved" && " · 마을에서 예약을 확정했어요"}
                          {b.status === "pending" && " · 마을의 승인을 기다리고 있어요"}
                          {b.status === "rejected" && " · 마을에서 예약을 받을 수 없대요"}
                          {b.status === "cancelled" && " · 예약을 취소했어요"}
                        </p>
                        {(b.status === "pending" || b.status === "approved") &&
                          b.items.some((i) => i.type === "lodging") && (
                            <p className="text-xs text-clay-600">
                              체크아웃일({formatMonthDay(lodgingCheckout(b))})에 숙박 20% 할인 쿠폰이 발급돼요(예약일로부터
                              1년간 유효) · 그 전에 취소하면 발급되지 않아요
                            </p>
                          )}
                        {(b.status === "pending" || b.status === "approved") && todayIso() < b.start_date && (
                          <button
                            disabled={cancellingId === b.id}
                            onClick={() => handleCancel(b)}
                            className="text-xs text-ink-faint underline disabled:opacity-50"
                          >
                            예약 취소
                          </button>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {lastVillage && (
              <div className="rounded-xl bg-clay-100 px-4 py-3 text-sm text-clay-700">
                🌱 지난번 다녀오신 <b>{lastVillage.name}</b>, 수확체험이 시작됐어요
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-soft">구독한 마을</p>
              {subscribed.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {subscribed.map(
                    (v) =>
                      v && (
                        <Link key={v.id} href={`/villages/${v.id}?tab=소식`}>
                          <Card className="text-center">
                            <p className="font-semibold">{v.name.split(" ")[0]}</p>
                            <p className="mt-1 text-xs text-ink-faint">
                              소식 {v.notices.length + v.reviews.length}
                            </p>
                          </Card>
                        </Link>
                      )
                  )}
                </div>
              ) : (
                <Card className="flex flex-col items-center gap-3 py-8 text-center">
                  <p className="text-sm text-ink-faint">아직 관계 맺은 마을이 없어요.</p>
                  <Link
                    href="/villages"
                    className="flex h-11 w-auto items-center justify-center rounded-xl border border-line bg-white px-6 text-sm font-semibold text-ink"
                  >
                    마을 찾아보기
                  </Link>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowCoupons((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold"
            >
              쿠폰함
              <span className="text-ink-soft">
                {accessToken ? `사용 가능 ${availableCouponCount}장` : "로그인 필요"} {showCoupons ? "▲" : "›"}
              </span>
            </button>
            {showCoupons && (
              <div className="space-y-2">
                {!accessToken ? (
                  <Card className="py-5 text-center text-sm text-ink-faint">
                    로그인하면 가입 쿠폰을 받을 수 있어요.
                  </Card>
                ) : couponsError ? (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{couponsError}</p>
                ) : coupons === null ? (
                  <p className="text-sm text-ink-faint">불러오는 중...</p>
                ) : coupons.length === 0 ? (
                  <Card className="py-5 text-center text-sm text-ink-faint">
                    사용할 수 있는 쿠폰이 없어요.
                  </Card>
                ) : (
                  coupons.map((c) => (
                    <Card key={c.id} className={`space-y-1 ${c.status === "available" ? "" : "opacity-60"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{c.title}</span>
                        <Badge tone={c.status === "available" ? "leaf" : "neutral"}>
                          {COUPON_STATUS_TEXT[c.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-soft">
                        {c.applies_to === "lodging" ? "숙박 예약 시" : "숙박·체험 예약 시"} {c.discount_percent}% 할인
                      </p>
                      <p className="text-xs text-ink-faint">
                        {c.status === "used" && c.used_at
                          ? `${formatKstDate(c.used_at)} 사용`
                          : `${formatKstDate(c.expires_at)}까지`}
                      </p>
                    </Card>
                  ))
                )}
              </div>
            )}

            {subscribed[0] && (
              <Link
                href={`/villages/${subscribed[0]!.id}?tab=소식`}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold"
              >
                마을 커뮤니티 게시판
                <span className="text-ink-soft">›</span>
              </Link>
            )}
          </div>
        </div>
        <BottomNav />
      </Shell>
      {reviewTarget && (
        <ReviewFormModal
          title={`${reviewTarget.item.type === "experience" ? "체험" : "숙박"} 리뷰 · ${reviewTarget.item.title}`}
          initial={reviewTarget.item.review ?? undefined}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </>
  );
}
