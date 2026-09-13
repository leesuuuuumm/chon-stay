"use client";

import { usePathname } from "next/navigation";
import Shell from "@/components/Shell";
import HostBottomNav from "@/components/HostBottomNav";
import DesktopSectionNav from "@/components/DesktopSectionNav";

const NAV_ITEMS = [
  { href: "/host/dashboard", label: "대시보드" },
  { href: "/host/reservations", label: "예약 관리" },
  { href: "/host/community", label: "커뮤니티" },
  { href: "/host/insights", label: "인사이트" },
];

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = NAV_ITEMS.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {showNav && <DesktopSectionNav items={NAV_ITEMS} />}
      <Shell withBottomPadding={showNav} size={showNav ? "wide" : "narrow"}>
        {children}
        {showNav && <HostBottomNav />}
      </Shell>
    </>
  );
}
