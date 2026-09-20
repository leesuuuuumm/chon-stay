'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Shell from '@/components/Shell';
import AppHeader from '@/components/AppHeader';
import Button from '@/components/ui/Button';
import { signup, login, fetchMe, extractErrorMessage } from '@/lib/api';
import { useAppStore } from '@/lib/store';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAppStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 달라요.');
      return;
    }
    setLoading(true);
    try {
      await signup({ email, password, username });
      const { access_token } = await login({ email, password });
      const user = await fetchMe(access_token);
      setAuth(access_token, user);
      router.push(searchParams.get('redirect') || '/onboarding');
    } catch (err) {
      setError(
        extractErrorMessage(err, '회원가입에 실패했어요. 다시 시도해주세요.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <AppHeader title="회원가입" />
      <div className="flex flex-1 flex-col px-5 py-6 md:my-6 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
        <h2 className="text-2xl font-bold leading-snug">
          촌스테이가
          <br />
          처음이신가요?
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          계정을 만들면 관계 맺은 마을이 저장돼요.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="닉네임"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          />
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
            minLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          />
          <input
            type="password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 확인"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-faint">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/login"
            className="font-semibold text-ink underline underline-offset-2"
          >
            로그인
          </Link>
        </p>
      </div>
    </Shell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}
