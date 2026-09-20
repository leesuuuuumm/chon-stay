'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Shell from '@/components/Shell';
import AppHeader from '@/components/AppHeader';
import Button from '@/components/ui/Button';
import { login, fetchMe, extractErrorMessage } from '@/lib/api';
import { useAppStore } from '@/lib/store';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await login({ email, password });
      const user = await fetchMe(access_token);
      setAuth(access_token, user);
      if (user.is_admin) {
        router.push('/admin');
      } else {
        router.push(searchParams.get('redirect') || '/onboarding');
      }
    } catch (err) {
      setError(
        extractErrorMessage(err, '로그인에 실패했어요. 다시 시도해주세요.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <AppHeader title="로그인" showBack={false} />
      <div className="flex flex-1 flex-col px-5 py-6 md:my-6 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
        <h2 className="text-2xl font-bold leading-snug">
          다시 만나서
          <br />
          반가워요
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          로그인하면 구독한 마을·쿠폰을 다른 기기에서도 확인할 수 있어요.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-faint">
          아직 계정이 없으신가요?{' '}
          <Link
            href={
              searchParams.get('redirect')
                ? `/signup?redirect=${encodeURIComponent(searchParams.get('redirect')!)}`
                : '/signup'
            }
            className="font-semibold text-ink underline underline-offset-2"
          >
            회원가입
          </Link>
        </p>
      </div>
    </Shell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
