import type { Metadata } from "next";
import SpaceExperience from "@/components/home/SpaceExperience";
export const metadata: Metadata = { title: { absolute: "Zo7al Game" } };
export default function GamePage() { return <main className="fixed inset-0 h-dvh overflow-hidden bg-[var(--bg)]"><SpaceExperience gameOnly /></main>; }
