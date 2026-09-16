"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
const query = "(display-mode: standalone), (display-mode: fullscreen)";
function installed() { return matchMedia(query).matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone); }
function subscribe(change: () => void) { const media = matchMedia(query); media.addEventListener("change", change); return () => media.removeEventListener("change", change); }
export default function AppShell({ children, navigation, footer }: { children: React.ReactNode; navigation: React.ReactNode; footer: React.ReactNode }) {
  const pathname = usePathname(), router = useRouter();
  const standalone = useSyncExternalStore(subscribe, installed, () => false);
  const game = pathname === "/game";
  useEffect(() => { if (standalone && !game) router.replace("/game"); }, [standalone, game, router]);
  if (game) return children;
  if (standalone) return null;
  return <div className="website-shell flex min-h-screen flex-col">{navigation}{children}{footer}</div>;
}
