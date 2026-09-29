"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Play } from "lucide-react";
import Image from "next/image";
import DetailsDialog from "@/components/ui/DetailsDialog";
import BrandIcon, { brandDisplayColor, INSTAGRAM_GRADIENT } from "@/components/ui/BrandIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import PlatformEmbed from "./PlatformEmbed";
import type { SyncedSocial } from "@/lib/sync/socials";
import type { SocialPreview } from "@/lib/sync/social-preview-data";

const headings: Record<string, string> = { youtube: "latestLongVideo", x: "latestPost", threads: "latestPost", bluesky: "latestPost", instagram: "recentPosts", tiktok: "recentVideos", snapchat: "stories", twitch: "latestBroadcast", kick: "latestBroadcast", discord: "community", modrinth: "latestProjects", curseforge: "releases", fortnite: "islands", epicgames: "games", roblox: "games", linktree: "accountLinks" };
const embedded = new Set(["x", "instagram", "tiktok", "snapchat"]);

export default function SocialDetails({ social, description, games, onClose }: { social: SyncedSocial; description: string; games: boolean; onClose: () => void }) {
  const t = useTranslations("socials"), format = useFormatter();
  const [preview, setPreview] = useState<SocialPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/social-preview?url=${encodeURIComponent(social.url)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setPreview(data?.preview ?? null); })
      .catch(() => { /* Known account details and links remain available. */ })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [social.url]);
  const title = preview?.title || (games ? "Zo7al Games" : "Zo7al");
  const color = brandDisplayColor(social.platform);
  const gradient = social.platform === "instagram" ? INSTAGRAM_GRADIENT : `linear-gradient(135deg, color-mix(in srgb, ${color} 55%, #07080b), #0b0d12)`;
  const items = preview?.items ?? [];
  const canEmbed = embedded.has(social.platform) && !items.length && preview?.contentStatus !== "empty";
  const page = new URL(social.url);
  const contentUrl = social.platform === "twitch" ? `${page.origin}/${page.pathname.split("/").filter(Boolean)[0]}/videos?filter=archives&sort=time` : social.platform === "youtube" ? `${social.url.replace(/\/$/, "")}/videos` : social.url;
  // Red/purple brands need white button text; pale/yellow brands need dark text.
  const buttonText = ["youtube", "instagram", "twitch", "discord", "facebook", "bluesky", "playstation"].includes(social.platform) ? "#fff" : "#07080b";
  return <DetailsDialog title={`${t("preview")} · ${social.label}`} onClose={onClose} style={{ "--accent": color, "--glow": `color-mix(in srgb, ${color} 28%, transparent)` } as CSSProperties}>
    <div className="p-5 sm:p-7">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--accent)]"><BrandIcon slug={social.platform} size={20} />{social.label}<span className="ms-auto max-w-[50%] truncate text-xs font-normal text-[var(--text-muted)]">{page.hostname}</span></div>
        <div className="relative h-24 overflow-hidden border-b border-[var(--border)] sm:h-32" style={{ background: gradient }}>
          <div className="absolute -end-3 -top-4 rotate-12 opacity-20"><BrandIcon slug={social.platform} color="#fff" size={160} /></div>
        </div>
        <div className="relative px-5 pb-6">
          <div className="-mt-9 mb-3 inline-flex size-[76px] items-center justify-center overflow-hidden rounded-full border-4 border-[var(--bg)] bg-[var(--surface)] text-[var(--accent)]">
            {preview?.image && !imageFailed ? <Image unoptimized src={preview.image} alt={title} width={76} height={76} onError={() => setImageFailed(true)} className="size-full object-cover" /> : <BrandIcon slug={social.platform} size={32} />}
          </div>
          <h3 dir="auto" className="text-xl font-bold">{title}</h3>
          {social.handle && <p dir="auto" className="mt-1 text-sm text-[var(--text-muted)]">{social.handle}</p>}
          <p className="mt-4 text-xs font-semibold text-[var(--accent)]">{t("accountDescription")}</p>
          <p dir="auto" className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">{preview?.description || description}</p>
          <h4 className="mt-6 border-t border-[var(--border)] pt-5 text-sm font-semibold">{t(social.platform === "x" && !items.length ? "recentPosts" : headings[social.platform] || "recentPosts")}</h4>
          {!!preview?.stats?.length && <dl className="mt-4 grid grid-cols-2 gap-3">{preview.stats.map(stat => <div key={stat.key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><dt className="text-xs text-[var(--text-muted)]">{t(stat.key)}</dt><dd className="mt-2 text-xl font-bold text-[var(--accent)]">{format.number(stat.value)}</dd></div>)}</dl>}
          <div className="mt-4 space-y-4">{items.map(item => {
            const video = item.kind === "video" || item.kind === "broadcast";
            const compact = ["project", "game", "link"].includes(item.kind);
            return <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" data-cursor="link" className={`group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--accent)] ${compact ? "flex items-center gap-4 p-4" : ""}`}>
              {item.image && <div className={`relative overflow-hidden ${compact ? "size-20 shrink-0 rounded-lg" : "aspect-video"}`}><Image unoptimized src={item.image} alt="" fill className={compact ? "object-contain" : "object-cover"} />{video && <span className="absolute inset-0 flex items-center justify-center bg-black/20"><span className="flex size-12 items-center justify-center rounded-full bg-[var(--accent)] transition-transform group-hover:scale-110" style={{ color: buttonText }}><Play size={22} fill="currentColor" /></span></span>}</div>}
              <div className={compact ? "min-w-0 flex-1" : "p-4"}><p dir="auto" className="whitespace-pre-line break-words text-sm font-medium">{item.title}</p>{item.detail && <p dir="auto" className="mt-2 line-clamp-3 text-xs text-[var(--text-muted)]">{item.detail}</p>}{item.publishedAt && Number.isFinite(Date.parse(item.publishedAt)) && <time dateTime={item.publishedAt} className="mt-2 block text-xs text-[var(--text-muted)]">{format.dateTime(new Date(item.publishedAt), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}</time>}</div>
              {compact && <SolidIcon name="arrow-up-right" size={14} className="shrink-0 text-[var(--accent)]" />}
            </a>;
          })}</div>
          {!loading && canEmbed && <PlatformEmbed platform={social.platform} url={social.url} />}
          <p role="status" className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">{loading ? t("previewLoading") : preview?.saved ? t("savedContent") : preview?.contentStatus === "empty" ? t("noContent") : items.length || preview?.stats?.length ? t("previewSource") : canEmbed ? t("embedNotice") : t("contentUnavailable")}</p>
          {!items.length && !preview?.stats?.length && <a href={contentUrl} target="_blank" rel="noopener noreferrer" data-cursor="link" className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--accent)]">{t("viewContent")}<SolidIcon name="arrow-up-right" size={12} /></a>}
          <a href={social.url} target="_blank" rel="noopener noreferrer" data-cursor="link" className="mt-5 flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" style={{ background: social.platform === "instagram" ? INSTAGRAM_GRADIENT : color, color: buttonText }}>{t("openProfile", { platform: social.label })}<SolidIcon name="arrow-up-right" size={14} /></a>
        </div>
      </div>
    </div>
  </DetailsDialog>;
}
