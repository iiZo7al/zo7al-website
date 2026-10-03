import type { CSSProperties } from "react";

const gradients: Record<string, readonly [string, string]> = {
  VIP: ["#fff29c", "#ffb347"],
  MVP: ["#b1ffcf", "#35ce95"],
  "MVP+": ["#92f4ff", "#4a9eff"],
  "MVP++": ["#c5a5ff", "#ff81d5"],
  BOOSTER: ["#ff9fda", "#ffc28f"],
  YOUTUBE: ["#ff8d8d", "#ffbb71"],
  TWITCH: ["#d5a2ff", "#8b9dff"],
  TIKTOK: ["#7df3ef", "#ff9bc2"],
  OWNER: ["#78ffda", "#68bbff"],
};
export default function RankName({ name, text, className = "", variant = "rank" }: { name: string; text?: string; className?: string; variant?: "rank" | "coins" }) {
  const key = name.trim().toUpperCase().replace(/\s+(?:RANK|UPGRADE)\b.*$/, "");
  const [start, end] = variant === "coins" ? ["#fff2a8", "#e9a62b"] : gradients[key] ?? ["#c5b8ff", "#85e6ff"];
  return <span className={`store-rank-gradient ${className}`} style={{ "--rank-start": start, "--rank-end": end } as CSSProperties}>{text ?? name}</span>;
}
