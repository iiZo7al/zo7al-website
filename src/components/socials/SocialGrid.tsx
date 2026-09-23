"use client";
import { useTranslations } from "next-intl";

import Reveal from "@/components/ui/Reveal";
import { SyncedSocial } from "@/lib/sync/socials";
import { SocialPreview } from "@/lib/sync/previews";
import SolidIcon from "@/components/ui/SolidIcon";
import BrandIcon, { brandDisplayColor } from "@/components/ui/BrandIcon";

export default function SocialGrid({
  socials, games = false
}: {
  socials: SyncedSocial[];
  games?: boolean;
  previews: Record<string, SocialPreview | null>
}) {
  const t = useTranslations("ui");
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {socials.map((social, i) => {
        const modrinth = social.platform === "modrinth";
        const brandColor = modrinth ? "#00AF5C" : social.color ?? "var(--accent)";
        const showHandle = Boolean(social.handle) && !["modrinth", "curseforge"].includes(social.platform);
        const platform = social.platform === "x" && /^https:\/\/(?:www\.)?(?:x|twitter)\.com\/i\/communities\//i.test(social.url)
          ? "x_community"
          : social.platform;
        const descriptionKey = social.platform === "linktree" && !/^https:\/\/linktr\.ee\/zo7algames\/?(?:[?#]|$)/i.test(social.url)
          ? ""
          : games ? `games_social_${platform}` : `social_${platform}`;
        return (
        <Reveal key={social.id} delay={i * 0.04}>
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
              style={{ background: brandColor }}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between">
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: modrinth ? "#00AF5C18" : brandColor,
                  boxShadow: `0 8px 20px ${brandColor + "40"}`
                }}
              >
                <BrandIcon
                  slug={social.platform}
                  size={24}
                  color={modrinth ? brandColor : "#FFFFFF"}
                />
              </div>
              <SolidIcon name="arrow-up-right" size={16} className="shrink-0 text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--text)]" />
            </div>

            <p className="mt-5 font-semibold" style={{ color: brandDisplayColor(social.platform) }}>{social.label}</p>
            {showHandle && <p className="text-sm text-[var(--text-muted)]">{social.handle}</p>}
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              {descriptionKey && t.has(descriptionKey) ? t(descriptionKey) : social.description || (games ? t("gamesAccount", { platform: social.label }) : social.label)}
            </p>
          </a>
        </Reveal>
      ); })}
    </div>
  );
}
