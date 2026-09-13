"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DesktopSectionNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-20 hidden h-16 items-center gap-8 border-b border-line bg-sand/95 px-8 backdrop-blur md:flex">
      <Link href="/" className="mr-2 text-lg font-extrabold">
        촌스테이
      </Link>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-semibold transition-colors ${
              active ? "text-ink" : "text-ink-faint hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
