"use client";

import Reveal from "@/components/ui/Reveal";
import { SyncedSocial } from "@/lib/sync/socials";
import { SocialPreview } from "@/lib/sync/previews";

export default function SocialGrid({
  socials,
  previews
}: {
  socials: SyncedSocial[];
  previews: Record<string, SocialPreview | null>
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {socials.map((social, i) => (
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
              style={{ background: social.color ?? "var(--accent)" }}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold"
                style={{ background: "var(--surface-elevated)", color: social.color ?? "var(--accent)" }}
              >
                {social.label.slice(0, 2).toUpperCase()}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--text)]"
                aria-hidden="true"
              >
                <path d="M4 12L12 4M12 4H5M12 4v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <p className="mt-5 font-semibold">{social.label}</p>
            <p className="text-sm text-[var(--text-muted)]">{social.handle ?? ""}</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              {social.description}
            </p>
          </a>
        </Reveal>
      ))}
    </div>
  );
}
