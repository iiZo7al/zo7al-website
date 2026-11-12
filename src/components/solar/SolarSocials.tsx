"use client";

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
            ? "#F59E0B"
            : item.id === "linktree"
            ? "#43E660"
            : brandDisplayColor(item.id);

        return (
          <Reveal key={item.id} delay={i * 0.04}>
            <article
              className="card-glow group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "var(--solar-card)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `${brandColor}18`,
                      boxShadow: `0 8px 20px ${brandColor}30`,
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
                    className="shrink-0 text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-amber-400"
                  />
                </div>

                <div className="mt-5">
                  <span className="inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300 mb-2 border border-amber-500/20">
                    {item.badge}
                  </span>
                  <h3 className="font-bold text-white text-base">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="after:absolute after:inset-0 after:rounded-2xl"
                    >
                      {item.title}
                    </a>
                  </h3>
                  {item.handle && (
                    <p dir="ltr" className="text-xs text-[var(--text-muted)] mt-1 font-mono text-right">
                      {item.handle}
                    </p>
                  )}
                  {item.code && (
                    <p dir="ltr" className="text-xs text-amber-400 mt-1 font-mono font-bold text-right">
                      Code: {item.code}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">
                <span>زيارة الحساب</span>
                <span className="text-amber-400 font-medium">متابعة ←</span>
              </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
