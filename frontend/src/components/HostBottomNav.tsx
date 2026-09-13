"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/host/dashboard", label: "대시보드", icon: "📋" },
  { href: "/host/reservations", label: "예약", icon: "✅" },
  { href: "/host/community", label: "커뮤니티", icon: "💬" },
  { href: "/host/insights", label: "인사이트", icon: "📊" },
];

export default function HostBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex h-16 border-t border-line bg-white md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
              active ? "text-clay-600" : "text-ink-faint"
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
