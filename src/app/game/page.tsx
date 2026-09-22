import type { Metadata } from "next";
import SpaceExperience from "@/components/home/SpaceExperience";
export const metadata: Metadata = {
  title: { absolute: "Zo7al Game" }, applicationName: "Zo7al Game", manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Zo7al Game", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/assets/app/icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/assets/app/icon-180.png", sizes: "180x180", type: "image/png" }] },
};
export default function GamePage() { return <main className="fixed inset-0 h-dvh overflow-hidden bg-[var(--bg)]"><SpaceExperience gameOnly /></main>; }
