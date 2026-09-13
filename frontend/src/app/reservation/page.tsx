"use client";

import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";

export default function ReservationPage() {
  const router = useRouter();
  const { cart, removeFromCart, clearCart, setLastVisitedVillage } = useAppStore();
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = () => {
    const villageId = cart[0]?.villageId;
    if (villageId) setLastVisitedVillage(villageId);
    clearCart();
    router.push(villageId ? `/visit-complete?village=${villageId}` : "/visit-complete");
  };

  return (
    <Shell withBottomPadding>
      <AppHeader title="신청 장바구니" stage="체험" />
      <div className="flex-1 space-y-3 px-5 py-5">
        {cart.length === 0 && (
          <div className="py-16 text-center text-sm text-ink-faint">
            담긴 체험·숙박이 없어요.
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push("/villages")}>
                마을 둘러보기
              </Button>
            </div>
          </div>
        )}
        {cart.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-3">
            <div>
              <Badge tone={item.type === "experience" ? "leaf" : "clay"}>
                {item.type === "experience" ? "체험" : "숙박"} · {item.villageName}
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
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-app border-t border-line bg-sand px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">합계</span>
            <span className="text-lg font-bold">{total.toLocaleString()}원</span>
          </div>
          <Button onClick={handleSubmit}>신청하기</Button>
          <p className="mt-2 text-center text-xs text-ink-faint">→ 마을 대시보드로 실시간 알림</p>
        </div>
      )}
    </Shell>
  );
}
