"use client";

import { usePathname } from "next/navigation";
import Shell from "@/components/Shell";
import HostBottomNav from "@/components/HostBottomNav";

const NAV_ROUTES = ["/host/dashboard", "/host/reservations", "/host/community", "/host/insights"];

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = NAV_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <Shell withBottomPadding={showNav}>
      {children}
      {showNav && <HostBottomNav />}
    </Shell>
  );
}
