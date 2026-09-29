"use client";
import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";

import Reveal from "@/components/ui/Reveal";
import { SyncedSocial } from "@/lib/sync/socials";
import SocialDetails from "./SocialDetails";
import DetailsIcon from "@/components/ui/DetailsIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import BrandIcon, { brandDisplayColor, INSTAGRAM_GRADIENT } from "@/components/ui/BrandIcon";

export default function SocialGrid({
  socials, games = false
}: {
  socials: SyncedSocial[];
  games?: boolean;
}) {
  const t = useTranslations("ui");
  const store = useTranslations("store");
  const [selected, setSelected] = useState<{ social: SyncedSocial; description: string } | null>(null);
  return (
    <>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {socials.map((social, i) => {
        const brandColor = brandDisplayColor(social.platform);
        const showHandle = Boolean(social.handle) && !["modrinth", "curseforge"].includes(social.platform);
        const platform = social.platform === "x" && /^https:\/\/(?:www\.)?(?:x|twitter)\.com\/i\/communities\//i.test(social.url)
          ? "x_community"
          : social.platform;
        const descriptionKey = social.platform === "linktree" && !/^https:\/\/linktr\.ee\/zo7algames\/?(?:[?#]|$)/i.test(social.url)
          ? ""
          : games ? `games_social_${platform}` : `social_${platform}`;
        const description = descriptionKey && t.has(descriptionKey) ? t(descriptionKey) : social.description || (games ? t("gamesAccount", { platform: social.label }) : social.label);
        return (
        <Reveal key={social.id} delay={i * 0.04}>
          <article
            className="card-glow group relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
            style={{ background: "var(--surface)", borderColor: "var(--border)", "--card-glow-color": brandColor } as CSSProperties}
          >
            <div className="flex items-center justify-between">
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: social.platform === "instagram" ? INSTAGRAM_GRADIENT : `${brandColor}18`,
                  boxShadow: `0 8px 20px ${brandColor + "40"}`
                }}
              >
                <BrandIcon
                  slug={social.platform}
                  size={24}
                  color={social.platform === "instagram" ? "#FFFFFF" : brandColor}
                />
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setSelected({ social, description })} aria-label={`${store("details")} — ${social.label}`} title={store("details")} aria-haspopup="dialog" className="relative z-10 inline-flex size-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"><DetailsIcon /></button>
                <SolidIcon name="arrow-up-right" size={16} className="shrink-0 text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--text)]" />
              </div>
            </div>

            <p className="mt-5 font-semibold" style={{ color: brandDisplayColor(social.platform) }}><a href={social.url} target="_blank" rel="noopener noreferrer" data-cursor="link" className="after:absolute after:inset-0 after:rounded-2xl">{social.label}</a></p>
            {showHandle && <p className="text-sm text-[var(--text-muted)]">{social.handle}</p>}
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              {description}
            </p>
          </article>
        </Reveal>
      ); })}
    </div>
    {selected && <SocialDetails key={selected.social.url} social={selected.social} description={selected.description} games={games} onClose={() => setSelected(null)} />}
    </>
  );
}
