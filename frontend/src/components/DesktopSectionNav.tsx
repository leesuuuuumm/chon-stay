"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DesktopSectionNav({
  items,
  right,
}: {
  items: { href: string; label: string }[];
  right?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-20 hidden h-16 border-b border-line bg-sand/95 backdrop-blur md:block">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-8 px-8">
        <Link href="/" className="mr-2 text-lg font-extrabold">
          숨, 표
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
        {right && <div className="ml-auto">{right}</div>}
      </div>
    </nav>
  );
}
