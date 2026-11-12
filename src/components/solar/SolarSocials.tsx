"use client";

import type { CSSProperties } from "react";
import BrandIcon, { brandDisplayColor } from "@/components/ui/BrandIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import Reveal from "@/components/ui/Reveal";
import { SOLAR_SOCIALS } from "@/lib/data/solar";

export default function SolarSocials() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" dir="rtl">
      {SOLAR_SOCIALS.map((item, i) => {
        const brandColor =
          item.id === "whatsapp"
            ? "#25D366"
            : item.id === "snapchat"
            ? "#FFFC00"
            : item.id === "threads"
            ? "#FFFFFF"
            : item.id === "bluesky"
            ? "#0285FF"
            : item.id === "fortnite"
            ? "#8B5CF6"
            : item.id === "linktree"
            ? "#43E660"
            : brandDisplayColor(item.id);

        return (
          <Reveal key={item.id} delay={i * 0.04}>
            <article
              className="card-glow group relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
              style={
                {
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  "--card-glow-color": brandColor,
                } as CSSProperties
              }
            >
              <div className="flex items-center justify-between">
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${brandColor}18`,
                    boxShadow: `0 8px 20px ${brandColor + "40"}`,
                  }}
                >
                  <BrandIcon
                    slug={
                      item.id === "fortnite"
                        ? "epicgames"
                        : item.id === "linktree"
                        ? "linktree"
                        : item.id
                    }
                    size={24}
                    color={brandColor}
                  />
                </div>
                <SolidIcon
                  name="arrow-up-right"
                  size={16}
                  className="shrink-0 text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--text)]"
                />
              </div>

              <p
                className="mt-5 font-semibold"
                style={{ color: brandColor }}
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                  className="after:absolute after:inset-0 after:rounded-2xl"
                >
                  {item.title}
                </a>
              </p>

              {item.handle && (
                <p
                  dir="ltr"
                  className="mt-1 text-xs text-[var(--text-muted)] font-mono text-right"
                >
                  {item.handle}
                </p>
              )}

              <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                {item.badge}
              </p>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
