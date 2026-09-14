"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Reveal from "@/components/ui/Reveal";
import {
  MODRINTH_API_URL,
  MODRINTH_FALLBACK,
  MODRINTH_PROFILE_URL,
  type ModrinthProject,
} from "@/lib/data/modrinth";

type RawProject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  project_type: string;
  categories: string[];
};

export default function ModpackGallery() {
  const t = useTranslations("modpacks");
  const tc = useTranslations("common");
  const [projects, setProjects] = useState<ModrinthProject[] | null>(null);
  const [source, setSource] = useState<"live" | "fallback">("fallback");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    fetch(MODRINTH_API_URL, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((data: RawProject[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        const mapped: ModrinthProject[] = data.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          description: p.description,
          iconUrl: p.icon_url,
          downloads: p.downloads,
          projectType: p.project_type,
          categories: p.categories ?? [],
          url: `https://modrinth.com/${p.project_type}/${p.slug}`,
        }));
        setProjects(mapped);
        setSource("live");
      })
      .catch(() => {
        if (!cancelled) {
          setProjects(MODRINTH_FALLBACK);
          setSource("fallback");
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const list = projects ?? MODRINTH_FALLBACK;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <p className="text-label">{source === "live" ? t("modrinthLiveLabel") : t("modrinthLabel")}</p>
        <a
          href={MODRINTH_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="link"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          {tc("viewProfile")} ↗
        </a>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((project, i) => (
          <Reveal key={project.id} delay={i * 0.05}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="project"
              className="group flex h-full flex-col rounded-2xl border p-6 transition-colors hover:border-[var(--border-strong)]"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                {project.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.iconUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-lg"
                    style={{ background: "var(--surface-elevated)" }}
                  />
                )}
                <div>
                  <p className="font-semibold">{project.title}</p>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    {project.projectType}
                  </p>
                </div>
              </div>

              <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                {project.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {project.categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{project.downloads} {tc("downloads")}</span>
                <span
                  className="font-semibold transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--accent)" }}
                >
                  {tc("viewProject")} →
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
