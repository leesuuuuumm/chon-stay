'use client';

import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import AppHeader from '@/components/AppHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store';
import { createBooking } from '@/lib/api';

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

  const handleSubmit = async () => {
    if (!accessToken || !visitDate || cart.length == 0) return;

    const villageId = Number(cart[0]?.villageId);
    const headcount = 1;

    try {
      await createBooking(accessToken, {
        village_id: villageId,
        headcount,
        visit_date: visitDate,
        total_price: total,
        items: cart.map((item) => ({
          quantity: 1,
          unit_price: item.price,
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
      alert('신청에 실패했어요. 다시 시도해주세요!');
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
              <p className="text-sm text-ink-soft">
                {item.meta} · {item.price.toLocaleString()}원
              </p>
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
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">합계</span>
            <span className="text-lg font-bold">
              {total.toLocaleString()}원
            </span>
          </div>
          <Button onClick={handleSubmit} disabled={!visitDate}>
            신청하기
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
