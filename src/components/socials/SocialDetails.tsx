"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import Image from "next/image";
import DetailsDialog from "@/components/ui/DetailsDialog";
import BrandIcon from "@/components/ui/BrandIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import type { SyncedSocial } from "@/lib/sync/socials";
import type { SocialPreview } from "@/lib/sync/social-preview-data";

export default function SocialDetails({ social, description, games, onClose }: { social: SyncedSocial; description: string; games: boolean; onClose: () => void }) {
  const t = useTranslations("socials");
  const [preview, setPreview] = useState<SocialPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/social-preview?url=${encodeURIComponent(social.url)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setPreview(data?.preview ?? null); })
      .catch(() => { /* Show the known profile link when public metadata is unavailable. */ })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [social.url]);
  const title = preview?.title || (games ? "Zo7al Games" : "Zo7al");
  const image = preview?.image;
  const youtube = social.platform === "youtube";
  const photo = ["instagram", "tiktok", "snapchat"].includes(social.platform);
  return <DetailsDialog title={`${t("preview")} · ${social.label}`} onClose={onClose}>
    <div className="p-5 sm:p-7">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--accent)]"><BrandIcon slug={social.platform} size={20} />{social.label}<span className="ms-auto max-w-[50%] truncate text-xs font-normal text-[var(--text-muted)]">{new URL(social.url).hostname}</span></div>
        <div className="relative h-24 overflow-hidden border-b border-[var(--border)] sm:h-32" style={{ background: "radial-gradient(ellipse at 80% 0%, var(--glow), transparent 75%), var(--surface)" }}>
          <div className="absolute -end-3 -top-4 rotate-12 text-[var(--accent)] opacity-10"><BrandIcon slug={social.platform} size={160} /></div>
        </div>
        <div className="relative px-5 pb-6">
          <div className="-mt-9 mb-3 inline-flex size-[76px] items-center justify-center overflow-hidden rounded-full border-4 border-[var(--bg)] bg-[var(--surface)] text-[var(--accent)]">
            {image && !imageFailed ? <Image unoptimized src={image} alt={title} width={76} height={76} onError={() => setImageFailed(true)} className="size-full object-cover" /> : <BrandIcon slug={social.platform} size={32} />}
          </div>
          <h3 dir="auto" className="text-xl font-bold">{title}</h3>
          {social.handle && <p dir="auto" className="mt-1 text-sm text-[var(--text-muted)]">{social.handle}</p>}
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
          {youtube && preview?.video ? <a href={preview.video.url} target="_blank" rel="noopener noreferrer" className="group mt-5 block overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="relative aspect-video"><Image unoptimized src={preview.video.image} alt="" fill className="object-cover" /><span className="absolute inset-0 flex items-center justify-center bg-black/20"><span className="flex size-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)] transition-transform group-hover:scale-110"><Play size={22} fill="currentColor" /></span></span></div>
            <div className="p-4"><p className="mb-1 text-xs text-[var(--accent)]">{t("latestVideo")}</p><p dir="auto" className="text-sm font-medium">{preview.video.title}</p></div>
          </a> : image && !imageFailed && <div className={`relative mt-5 overflow-hidden rounded-xl border border-[var(--border)] ${photo ? "aspect-square max-h-80" : "aspect-video"}`}><Image unoptimized src={image} alt={title} fill onError={() => setImageFailed(true)} className="object-contain" /></div>}
          <p role="status" className="mt-4 text-xs text-[var(--text-muted)]">{loading ? t("previewLoading") : preview && !imageFailed ? t("previewSource") : t("previewUnavailable")}</p>
          <a href={social.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg)]">{t("openProfile", { platform: social.label })}<SolidIcon name="arrow-up-right" size={14} /></a>
        </div>
      </div>
    </div>
  </DetailsDialog>;
}
