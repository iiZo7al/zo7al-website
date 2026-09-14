"use client";

import Reveal from "@/components/ui/Reveal";
import MagneticButton from "@/components/cursor/MagneticButton";
import { STORE_RANKS } from "@/lib/data/store";

export default function StoreRanks() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {STORE_RANKS.map((rank, i) => (
        <Reveal key={rank.id} delay={i * 0.06}>
          <div
            className="relative flex h-full flex-col rounded-2xl border p-7"
            style={{
              background: rank.featured ? "var(--surface-elevated)" : "var(--surface)",
              borderColor: rank.featured ? "var(--accent)" : "var(--border)",
              boxShadow: rank.featured ? "0 0 40px var(--glow)" : "none",
            }}
          >
            {rank.featured && (
              <span
                className="absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ background: "var(--accent)", color: "#07080B" }}
              >
                Most popular
              </span>
            )}
            <p className="text-label" style={{ color: "var(--accent)" }}>
              Rank
            </p>
            <h3 className="mt-2 text-2xl font-bold">{rank.name}</h3>
            <p className="mt-3 text-3xl font-bold">{rank.price}</p>

            <ul className="mt-6 flex-1 space-y-3">
              {rank.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--accent)" }}
                    aria-hidden="true"
                  >
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {perk}
                </li>
              ))}
            </ul>

            <MagneticButton className="mt-7">
              <a
                href={rank.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="button"
                className="flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold w-full"
                style={{
                  background: rank.featured ? "var(--accent)" : "transparent",
                  color: rank.featured ? "#07080B" : "var(--text)",
                  border: rank.featured ? "none" : "1px solid var(--border-strong)",
                }}
              >
                Get {rank.name}
              </a>
            </MagneticButton>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
