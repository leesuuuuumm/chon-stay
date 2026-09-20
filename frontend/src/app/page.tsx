'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import PhotoPlaceholder from '@/components/PhotoPlaceholder';
import AuthNavStatus from '@/components/AuthNavStatus';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { accessToken } = useAppStore();
  const handleTravelerStart = () => {
    if (accessToken) {
      router.push('/onboarding');
    } else {
      router.push('/login?redirect=/onboarding');
    }
  };

  return (
    <main className="min-h-screen bg-sand">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold leading-tight">숨, 표</h1>
          <AuthNavStatus />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <PhotoPlaceholder
              emoji="🧳"
              label="여행자"
              className="h-32 rounded-xl"
            />
            <div>
              <h2 className="text-lg font-bold">여행자이신가요?</h2>
              <p className="mt-1 text-sm text-ink-soft">
                관심사를 알려주시면 딱 맞는 마을과 체류 코스를 추천해드려요.
              </p>
            </div>
            <button
              onClick={handleTravelerStart}
              className="flex h-12 items-center justify-center rounded-xl bg-ink font-semibold text-white transition-colors hover:bg-ink/90"
            >
              여행자로 시작하기
            </button>
          </Card>

          <Card className="flex flex-col gap-4">
            <PhotoPlaceholder
              emoji="🏘️"
              label="마을 대표자"
              className="h-32 rounded-xl"
            />
            <div>
              <h2 className="text-lg font-bold">마을 대표자·이장이신가요?</h2>
              <p className="mt-1 text-sm text-ink-soft">
                마을을 등록하고 예약·리뷰·방문 인사이트를 한곳에서 관리하세요.
              </p>
            </div>
            <Link
              href="/host/signup"
              className="flex h-12 items-center justify-center rounded-xl bg-clay-500 font-semibold text-white transition-colors hover:bg-clay-600"
            >
              마을 등록하기
            </Link>
          </Card>
        </div>
      </div>
    </main>
  );
}
