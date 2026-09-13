"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/villages", label: "마을 찾기", icon: "🔍" },
  { href: "/mypage", label: "마이페이지", icon: "🏡" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex h-16 w-full max-w-app border-t border-line bg-white">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
              active ? "text-ink" : "text-ink-faint"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
