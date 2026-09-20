'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import AppHeader from '@/components/AppHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store';
import { addDays, formatMonthDay } from '@/lib/dates';
import {
  createBooking,
  extractErrorMessage,
  fetchMyCoupons,
  type Coupon,
} from '@/lib/api';

export default function ReservationPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    clearCart,
    setLastVisitedVillage,
    visitDate,
    accessToken,
  } = useAppStore();
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const lodgingTotal = cart
    .filter((item) => item.type === 'lodging')
    .reduce((sum, item) => sum + item.price, 0);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  // null: 자동(가장 할인이 큰 쿠폰), 'none': 적용 안 함, 숫자: 직접 선택
  const [couponChoice, setCouponChoice] = useState<number | 'none' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetchMyCoupons(accessToken)
      .then((list) => {
        setCoupons(list.filter((c) => c.status === 'available'));
      })
      .catch(() => setCoupons([]));
  }, [accessToken]);

  const isApplicable = (c: Coupon) =>
    c.applies_to === 'all' || lodgingTotal > 0;
  const discountOf = (c: Coupon) =>
    Math.floor(
      ((c.applies_to === 'lodging' ? lodgingTotal : total) *
        c.discount_percent) /
        100,
    );
  const bestCoupon =
    [...coupons]
      .filter(isApplicable)
      .sort((a, b) => discountOf(b) - discountOf(a))[0] ?? null;
  const selectedCoupon =
    couponChoice === 'none'
      ? null
      : couponChoice === null
        ? bestCoupon
        : (coupons.find((c) => c.id === couponChoice && isApplicable(c)) ??
          null);
  const discount = selectedCoupon ? discountOf(selectedCoupon) : 0;
  const payable = total - discount;

  const handleSubmit = async () => {
    if (!accessToken || !visitDate || cart.length == 0 || submitting) return;

    const villageId = Number(cart[0]?.villageId);
    const headcount = 1;

    setSubmitting(true);
    try {
      await createBooking(accessToken, {
        village_id: villageId,
        headcount,
        visit_date: visitDate,
        total_price: total,
        coupon_id: selectedCoupon?.id,
        items: cart.map((item) => ({
          // 숙박은 수량이 박수, 1박 가격이 단가
          quantity: item.type === 'lodging' ? (item.nights ?? 1) : 1,
          unit_price:
            item.type === 'lodging'
              ? (item.unitPrice ?? item.price)
              : item.price,
          subtotal: item.price,
          experience_id:
            item.type === 'experience' ? Number(item.id) : undefined,
          lodging_id: item.type === 'lodging' ? Number(item.id) : undefined,
        })),
      });
      clearCart();
      router.push(
        villageId ? `/visit-complete?village=${villageId}` : '/visit-complete',
      );
    } catch (err) {
      alert(
        extractErrorMessage(err, '신청에 실패했어요. 다시 시도해주세요!'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell withBottomPadding size="medium">
      <AppHeader title="신청 장바구니" stage="체험" />
      <div className="flex-1 space-y-3 px-5 py-5">
        {cart.length > 0 && (
          <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
            <span className="font-semibold">방문 날짜</span>
            <span className="ml-2 text-ink-soft">
              {visitDate || '선택되지 않았어요'}
            </span>
          </div>
        )}
        {cart.length === 0 && (
          <div className="py-16 text-center text-sm text-ink-faint">
            담긴 체험·숙박이 없어요.
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                fullWidth={false}
                className="px-8"
                onClick={() => router.push('/villages')}
              >
                마을 둘러보기
              </Button>
            </div>
          </div>
        )}
        {cart.map((item) => (
          <Card
            key={item.id}
            className="flex items-start justify-between gap-3"
          >
            <div>
              <Badge tone={item.type === 'experience' ? 'leaf' : 'clay'}>
                {item.type === 'experience' ? '체험' : '숙박'} ·{' '}
                {item.villageName}
              </Badge>
              <p className="mt-2 font-semibold">{item.title}</p>
              {item.type === 'lodging' && visitDate ? (
                <p className="text-sm text-ink-soft">
                  {formatMonthDay(visitDate)} 체크인 →{' '}
                  {formatMonthDay(addDays(visitDate, item.nights ?? 1))}{' '}
                  체크아웃 ({item.nights ?? 1}박) · {item.price.toLocaleString()}원
                </p>
              ) : (
                <p className="text-sm text-ink-soft">
                  {item.meta} · {item.price.toLocaleString()}원
                </p>
              )}
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-sm text-ink-faint underline underline-offset-2"
            >
              삭제
            </button>
          </Card>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-sand px-5 py-4 md:static md:mx-5 md:mb-5 md:rounded-2xl md:border md:bg-white md:px-6 md:py-5 md:shadow-card">
          {coupons.length > 0 && (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-ink-soft">
                쿠폰 적용
              </label>
              <select
                value={selectedCoupon?.id ?? ''}
                onChange={(e) =>
                  setCouponChoice(e.target.value ? Number(e.target.value) : 'none')
                }
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="">적용 안 함</option>
                {coupons.map((c) => (
                  <option key={c.id} value={c.id} disabled={!isApplicable(c)}>
                    {c.title} ({c.expires_at.slice(0, 10)}까지)
                    {!isApplicable(c) ? ' - 숙박 예약에만 사용 가능' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {discount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-ink-soft">
                <span>상품 금액</span>
                <span>{total.toLocaleString()}원</span>
              </div>
              <div className="mb-2 flex items-center justify-between text-sm text-clay-600">
                <span>
                  쿠폰 할인 ({selectedCoupon?.discount_percent}%
                  {selectedCoupon?.applies_to === 'lodging' ? ' · 숙박 금액 기준' : ''})
                </span>
                <span>-{discount.toLocaleString()}원</span>
              </div>
            </>
          )}
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">
              {discount > 0 ? '결제 예정 금액' : '합계'}
            </span>
            <span className="text-lg font-bold">
              {payable.toLocaleString()}원
            </span>
          </div>
          <Button onClick={handleSubmit} disabled={!visitDate || submitting}>
            {submitting ? '신청 중...' : '신청하기'}
          </Button>
          {!visitDate && (
            <p className="mt-2 text-center text-xs text-red-600">
              방문 날짜를 선택해주세요.
            </p>
          )}
          <p className="mt-2 text-center text-xs text-ink-faint">
            → 마을 대시보드로 실시간 알림
          </p>
        </div>
      )}
    </Shell>
  );
}
