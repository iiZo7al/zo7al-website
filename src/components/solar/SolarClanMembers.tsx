"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  Globe,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import BrandIcon, { BRAND_ICONS } from "@/components/ui/BrandIcon";
import DetailsDialog from "@/components/ui/DetailsDialog";
import DetailsIcon from "@/components/ui/DetailsIcon";
import {
  SOLAR_MEMBER_SOCIAL_PLATFORMS,
  type SolarMember,
} from "@/lib/data/solar-members";
import "@/components/community/community.css";

function SocialPlatformIcon({ platform }: { platform: string }) {
  if (platform in BRAND_ICONS) {
    return <BrandIcon slug={platform} size={18} />;
  }
  return <Globe size={18} aria-hidden="true" />;
}

export default function SolarClanMembers() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const common = useTranslations("common");
  const store = useTranslations("store");
  const [members, setMembers] = useState<SolarMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<SolarMember | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/solar/members", { signal: controller.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!controller.signal.aborted && Array.isArray(d?.members)) {
          setMembers(d.members);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <p className="community-empty" role="status">
        <Users size={20} aria-hidden="true" />
        {isAr ? "جاري تحميل أعضاء الكلان..." : "Loading clan members..."}
      </p>
    );
  }

  if (members.length === 0) {
    return (
      <p className="community-empty" role="status">
        <Users size={20} aria-hidden="true" />
        {isAr
          ? "لا يوجد أعضاء مضافون حالياً في القائمة."
          : "No clan members listed yet."}
      </p>
    );
  }

  const visible = expanded ? members : members.slice(0, 8);
  const number = new Intl.NumberFormat(locale);

  return (
    <>
      <ol className="community-leader-list" dir={isAr ? "rtl" : "ltr"}>
        {visible.map((member, index) => (
          <li key={member.id}>
            <div className="community-leader-row">
              <span className="community-leader-place">
                {index < 3 ? (
                  <Trophy size={19} aria-label={String(index + 1)} />
                ) : (
                  number.format(index + 1)
                )}
              </span>

              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] flex items-center justify-center">
                {member.avatar ? (
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={18} className="text-[var(--text-muted)]" />
                )}
              </span>

              <span className="community-leader-name">{member.name}</span>

              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold shrink-0"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent) 40%, var(--border))",
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                }}
              >
                {member.rank}
              </span>

              <button
                type="button"
                className="store-action store-details-button shrink-0"
                onClick={() => setSelected(member)}
                aria-haspopup="dialog"
                aria-label={`${store("details")} — ${member.name}`}
                title={store("details")}
                data-cursor="button"
              >
                <DetailsIcon />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {members.length > 8 && !expanded && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            className="hub-button"
            data-cursor="button"
            onClick={() => setExpanded(true)}
          >
            {common("viewMore")}
          </button>
        </div>
      )}

      {selected && (
        <DetailsDialog
          title={`${store("details")} · ${selected.name}`}
          onClose={() => setSelected(null)}
        >
          <div className="community-dialog-body space-y-5" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] flex items-center justify-center">
                {selected.avatar ? (
                  <Image
                    src={selected.avatar}
                    alt={selected.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={26} className="text-[var(--text-muted)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[var(--text)] truncate">
                  {selected.name}
                </h3>
                <span
                  className="mt-1.5 inline-block rounded-full border px-3 py-0.5 text-xs font-semibold"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--accent) 40%, var(--border))",
                    background:
                      "color-mix(in srgb, var(--accent) 12%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  {selected.rank}
                </span>
              </div>
            </div>

            {selected.bio && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  {isAr ? "نبذة عن العضو" : "About"}
                </p>
                <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                  {selected.bio}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-3">
                {isAr ? "حسابات العضو" : "Social Accounts"}
              </p>
              {selected.socials.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
                  {isAr
                    ? "لم تتم إضافة حسابات لهذا العضو بعد."
                    : "No social accounts linked yet."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selected.socials.map((s, idx) => {
                    const platformLabel =
                      SOLAR_MEMBER_SOCIAL_PLATFORMS.find(
                        (p) => p.id === s.platform,
                      )?.label ?? s.platform;
                    return (
                      <a
                        key={`${s.platform}-${idx}`}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="link"
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-elevated)]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[var(--accent)] shrink-0">
                            <SocialPlatformIcon platform={s.platform} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text)] truncate">
                              {platformLabel}
                            </p>
                            {s.label && (
                              <p
                                className="text-[11px] text-[var(--text-muted)] truncate"
                                dir="ltr"
                              >
                                {s.label}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight
                          size={14}
                          className="text-[var(--text-muted)] shrink-0"
                        />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DetailsDialog>
      )}
    </>
  );
}
