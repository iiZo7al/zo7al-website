import type { CSSProperties } from "react";
import { rankGradient } from "@/lib/data/rank-style";
export default function RankName({ name, text, className = "", variant = "rank" }: { name: string; text?: string; className?: string; variant?: "rank" | "coins" }) {
  const [start, end] = variant === "coins" ? ["#fff2a8", "#e9a62b"] : rankGradient(name);
  return <span className={`store-rank-gradient ${className}`} style={{ "--rank-start": start, "--rank-end": end } as CSSProperties}>{text ?? name}</span>;
}
