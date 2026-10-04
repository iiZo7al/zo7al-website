"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export default function AppShell({ children, navigation, footer }: { children: React.ReactNode; navigation: React.ReactNode; footer: React.ReactNode }) {
  const pathname = usePathname();
  // iOS launches the bookmarked URL rather than always honoring start_url.
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone && pathname !== "/game") window.location.replace("/game");
  }, [pathname]);
  if (pathname === "/game" || pathname === "/admin") return children;
  return <div className="website-shell flex min-h-screen flex-col">{navigation}{children}{footer}</div>;
}
