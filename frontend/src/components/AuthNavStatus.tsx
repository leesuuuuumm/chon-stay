"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";

export default function AuthNavStatus() {
  const { user, logout } = useAppStore();

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-semibold text-ink-faint hover:text-ink">
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/mypage" className="font-medium text-ink-soft hover:text-ink">
        {user.username}님 마이페이지
      </Link>
      <button
        onClick={logout}
        className="text-ink-faint underline underline-offset-2 hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}
