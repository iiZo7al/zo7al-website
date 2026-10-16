"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export default function AppShell({ children, navigation, footer }: { children: React.ReactNode; navigation: React.ReactNode; footer: React.ReactNode }) {
  const pathname = usePathname();
  // iOS launches the bookmarked URL rather than always honoring start_url.
  useEffect(() => {
    const root = document.documentElement;
    if (pathname === "/miku") root.dataset.accent = "miku";
    else if (root.dataset.accent === "miku") delete root.dataset.accent;
  }, [pathname]);
  // iOS launches the bookmarked URL rather than always honoring start_url.
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone && pathname !== "/game" && pathname !== "/miku") window.location.replace("/game");
  }, [pathname]);
  if (pathname === "/game" || pathname === "/admin" || pathname === "/dashboard") return children;
  return <div data-accent={pathname === "/miku" ? "miku" : undefined} className="website-shell flex min-h-screen flex-col">{navigation}{children}{footer}</div>;
}
