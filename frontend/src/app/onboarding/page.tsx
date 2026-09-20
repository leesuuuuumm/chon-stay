'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import AppHeader from '@/components/AppHeader';
import Chip from '@/components/ui/Chip';
import Button from '@/components/ui/Button';
import { INTERESTS, DURATIONS } from '@/lib/mockData';
import { useAppStore } from '@/lib/store';
import { getOnboardingRecommendations, extractErrorMessage } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const {
    interests,
    toggleInterest,
    duration,
    setDuration,
    accessToken,
    setRecommendations,
    resetOnboarding,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resetOnboarding();
  }, []);

  const handleRecommend = async () => {
    if (!accessToken) {
      router.push('/login?redirect=/onboarding');
      return;
    }
    if (!duration) {
      setError('체류 기간을 선택해주세요.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await getOnboardingRecommendations(accessToken, {
        interests,
        duration,
      });
      setRecommendations(result.recommendations);
      router.push('/villages');
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          '추천을 받아오지 못했어요. 다시 시도해주세요.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <AppHeader title="온보딩 · 관심사 선택" stage="발견" showBack={false} />
      <div className="flex flex-1 flex-col px-5 py-6 md:my-6 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
        <h2 className="text-2xl font-bold leading-snug">
          어떤 촌 경험을
          <br />
          찾고 계세요?
        </h2>

        <p className="mt-8 text-sm font-semibold text-ink-soft">
          관심사 (복수 선택)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <Chip
              key={interest}
              active={interests.includes(interest)}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Chip>
          ))}
        </div>

        <p className="mt-8 text-sm font-semibold text-ink-soft">체류 기간</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <Chip
              key={d}
              active={duration === d}
              onClick={() => setDuration(d)}
              className="justify-center"
            >
              {d}
            </Chip>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-auto flex flex-col items-center gap-4 pt-10">
          <Button onClick={handleRecommend} disabled={loading}>
            {loading ? '추천 찾는 중...' : '추천 받기'}
          </Button>
        </div>
      </div>
    </Shell>
  );
}
