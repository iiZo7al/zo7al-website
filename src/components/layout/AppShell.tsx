"use client";
import { usePathname } from "next/navigation";
export default function AppShell({ children, navigation, footer }: { children: React.ReactNode; navigation: React.ReactNode; footer: React.ReactNode }) {
  const pathname = usePathname();
  // Installed game launches still use /game; site installs keep their own navigation.
  if (pathname === "/game") return children;
  return <div className="website-shell flex min-h-screen flex-col">{navigation}{children}{footer}</div>;
}
