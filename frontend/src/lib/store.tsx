'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Duration, Interest } from './mockData';
import type { AuthUser, VillageRecommendation } from './api';

export type CartItem = {
  id: string;
  villageId: string;
  villageName: string;
  type: 'experience' | 'lodging';
  title: string;
  meta: string;
  price: number;
};

type AppState = {
  interests: Interest[];
  duration: Duration | null;
  cart: CartItem[];
  subscribedVillageIds: string[];
  lastVisitedVillageId: string | null;
  accessToken: string | null;
  user: AuthUser | null;
  recommendations: VillageRecommendation[];
};

type AppContextValue = AppState & {
  hydrated: boolean;
  toggleInterest: (interest: Interest) => void;
  setDuration: (duration: Duration) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  subscribeVillage: (villageId: string) => void;
  setLastVisitedVillage: (villageId: string) => void;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  setRecommendations: (recommendations: VillageRecommendation[]) => void;
};

const STORAGE_KEY = 'chonstay:v1';

const defaultState: AppState = {
  interests: [],
  duration: null,
  cart: [],
  subscribedVillageIds: [],
  lastVisitedVillageId: null,
  accessToken: null,
  user: null,
  recommendations: [],
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {
      // localStorage 접근 불가 시 기본 상태 유지
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 저장 실패는 무시 (프로토타입 범위)
    }
  }, [state, hydrated]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      hydrated,
      toggleInterest: (interest) =>
        setState((s) => ({
          ...s,
          interests: s.interests.includes(interest)
            ? s.interests.filter((i) => i !== interest)
            : [...s.interests, interest],
        })),
      setDuration: (duration) => setState((s) => ({ ...s, duration })),
      addToCart: (item) =>
        setState((s) =>
          s.cart.some((c) => c.id === item.id)
            ? s
            : { ...s, cart: [...s.cart, item] },
        ),
      removeFromCart: (id) =>
        setState((s) => ({ ...s, cart: s.cart.filter((c) => c.id !== id) })),
      clearCart: () => setState((s) => ({ ...s, cart: [] })),
      subscribeVillage: (villageId) =>
        setState((s) =>
          s.subscribedVillageIds.includes(villageId)
            ? s
            : {
                ...s,
                subscribedVillageIds: [...s.subscribedVillageIds, villageId],
              },
        ),
      setLastVisitedVillage: (villageId) =>
        setState((s) => ({ ...s, lastVisitedVillageId: villageId })),
      setAuth: (accessToken, user) =>
        setState((s) => ({ ...s, accessToken, user })),
      logout: () => setState((s) => ({ ...s, accessToken: null, user: null })),
      setRecommendations: (recommendations) =>
        setState((s) => ({ ...s, recommendations })),
    }),
    [state, hydrated],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
