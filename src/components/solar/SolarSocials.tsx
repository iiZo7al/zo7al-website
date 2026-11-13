"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations, useLocale } from "next-intl";
import BrandIcon, { brandDisplayColor } from "@/components/ui/BrandIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import DetailsIcon from "@/components/ui/DetailsIcon";
import Reveal from "@/components/ui/Reveal";
import SocialDetails from "@/components/socials/SocialDetails";
import type { SyncedSocial } from "@/lib/sync/socials";
import { SOLAR_SOCIALS } from "@/lib/data/solar";

export default function SolarSocials() {
  const store = useTranslations("store");
  const locale = useLocale();
  const [selected, setSelected] = useState<{
    social: SyncedSocial;
    description: string;
  } | null>(null);

  return (
    <>
      <div
        className="store-rank-grid"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
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
            <Reveal key={item.id} delay={i * 0.04} className="store-rank-reveal">
              <article
                className="store-rank group relative h-full"
                style={
                  {
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelected({
                          social: {
                            id: item.id,
                            platform:
                              item.id === "fortnite"
                                ? "fortnite"
                                : item.id === "linktree"
                                ? "linktree"
                                : item.id,
                            label: item.title,
                            url: item.url,
                            description: item.badge,
                          },
                          description: item.badge,
                        })
                      }
                      aria-label={`${store("details")} — ${item.title}`}
                      title={store("details")}
                      aria-haspopup="dialog"
                      className="relative z-10 inline-flex size-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                    >
                      <DetailsIcon />
                    </button>
                    <SolidIcon
                      name="arrow-up-right"
                      size={16}
                      className="shrink-0 text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--text)]"
                    />
                  </div>
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

                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                  {item.badge}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
      {selected && (
        <SocialDetails
          key={selected.social.url}
          social={selected.social}
          description={selected.description}
          games={false}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
