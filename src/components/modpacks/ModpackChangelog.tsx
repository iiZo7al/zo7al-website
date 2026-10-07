"use client";

import { useEffect, useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronDown, History, RefreshCw } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import SolidIcon from "@/components/ui/SolidIcon";
import { CHANGELOG_SOURCES, type ChangelogSource, type ModpackChangelogData } from "@/lib/data/modpack-changelog";
import "./modpacks.css";

export default function ModpackChangelog() {
  const t = useTranslations("modpacks"), hub = useTranslations("hub"), format = useFormatter(), selectId = useId();
  const [data, setData] = useState<ModpackChangelogData>({ projects: [], sources: [] });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [source, setSource] = useState<ChangelogSource | "all">("all"), [projectKey, setProjectKey] = useState("all");
  const [refresh, setRefresh] = useState(0), [limit, setLimit] = useState(6);

  useEffect(() => {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 60000);
    queueMicrotask(() => { if (!controller.signal.aborted) setStatus("loading"); });
    void fetch("/api/modpacks/changelog", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw Error("UNAVAILABLE");
        const result = await response.json() as ModpackChangelogData;
        if (!Array.isArray(result.projects) || !Array.isArray(result.sources)) throw Error("UNAVAILABLE");
        if (!controller.signal.aborted) { setData(result); setStatus("ready"); }
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); })
      .finally(() => clearTimeout(timeout));
    const timedOut = () => setStatus("error");
    controller.signal.addEventListener("abort", timedOut, { once: true });
    return () => { controller.signal.removeEventListener("abort", timedOut); clearTimeout(timeout); controller.abort(); };
  }, [refresh]);

  const projects = data.projects.filter(project => source === "all" || project.source === source);
  const releases = projects.filter(project => projectKey === "all" || project.projectKey === projectKey)
    .flatMap(project => project.releases.filter(release => release.changelog?.trim()).map(release => ({ project, release })))
    .sort((a, b) => Date.parse(b.release.published ?? "") - Date.parse(a.release.published ?? ""));
  const affected = data.sources.filter(item => (source === "all" || item.source === source) && item.status !== "live");

  return <section id="changelog" className="relative scroll-mt-28 border-t py-24 sm:py-32" style={{ borderColor: "var(--border)" }}>
    <div className="mx-auto max-w-[1180px] px-6">
      <SectionHeader eyebrow={t("changelogEyebrow")} title={t("changelogTitle")} text={t("changelogText")} />
      <div className="modpack-changelog-toolbar mt-12">
        <div className="hub-actions" role="group" aria-label={t("changelogSource")}>
          {(["all", ...CHANGELOG_SOURCES] as const).map(value => <button key={value} type="button" className="hub-button" aria-pressed={source === value} data-cursor="button" onClick={() => { setSource(value); setProjectKey("all"); setLimit(6); }}>{value === "all" ? t("changelogAllSources") : value}</button>)}
        </div>
        <div className="modpack-changelog-controls">
          <label htmlFor={selectId}>{t("changelogProject")}</label>
          <select id={selectId} className="modpack-changelog-select" value={projectKey} onChange={event => { setProjectKey(event.target.value); setLimit(6); }}>
            <option value="all">{t("changelogAllProjects")}</option>
            {projects.map(project => <option key={project.projectKey} value={project.projectKey}>{project.title} · {project.source}</option>)}
          </select>
          <button type="button" className="hub-button hub-icon-button" data-cursor="button" disabled={status === "loading"} aria-label={hub("refresh")} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={18} aria-hidden="true" className={status === "loading" ? "dash-spinning" : undefined} /></button>
        </div>
      </div>
      <div aria-busy={status === "loading"}>
        {status === "loading" && <p role="status" className="hub-muted mb-6">{t("changelogLoading")}</p>}
        {status === "error" && <p role="status" className="hub-muted mb-6">{t("changelogUnavailable")}</p>}
        {status === "ready" && affected.length > 0 && <p role="status" className="hub-muted mb-6">{t("changelogPartial", { sources: affected.map(item => item.source).join(", ") })}</p>}
        {releases.length > 0 ? <div className="modpack-changelog-list">
          {releases.slice(0, limit).map(({ project, release }, index) => <details key={project.projectKey + release.url} name={selectId + "-releases"} open={index === 0} className="card-glow modpack-changelog-card">
            <summary data-cursor="button">
              {project.iconUrl ? <img src={project.iconUrl} alt="" width={48} height={48} loading="lazy" /> : <span className="modpack-changelog-icon"><History size={22} aria-hidden="true" /></span> /* eslint-disable-line @next/next/no-img-element */}
              <span className="modpack-changelog-summary"><span className="text-label">{project.source}</span><strong dir="auto">{project.title}</strong><span className="modpack-changelog-meta"><span dir="auto">{release.version}</span>{release.published && <time dateTime={release.published}>{format.dateTime(new Date(release.published), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}</time>}</span></span>
              <ChevronDown size={18} className="modpack-changelog-chevron" aria-hidden="true" />
            </summary>
            <div className="modpack-changelog-body"><p dir="auto">{release.changelog}</p><a href={release.url} target="_blank" rel="noopener noreferrer" className="hub-button" data-cursor="link">{t("changelogViewSource", { source: project.source })}<SolidIcon name="arrow-up-right" /></a></div>
          </details>)}
        </div> : status === "ready" && !affected.length && <div className="community-empty"><History size={22} aria-hidden="true" /><p>{t("changelogEmpty")}</p></div>}
        {releases.length > limit && <div className="hub-actions justify-center mt-8"><button type="button" className="hub-button" data-cursor="button" onClick={() => setLimit(value => value + 6)}>{hub("viewMore")}<ChevronDown size={16} aria-hidden="true" /></button></div>}
      </div>
    </div>
  </section>;
}
