"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import ShareButton from "@/components/ui/ShareButton";
import QueryObserver from "@/components/hub/QueryObserver";
import InstallationGuide from "@/components/hub/InstallationGuide";
import ProjectExtras from "@/components/community/ProjectExtras";
import DetailsIcon from "@/components/ui/DetailsIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import { modrinthDetails, readableDescription, type ModpackDetails } from "@/lib/data/modpack-details";
import type { ModpackChangelogData } from "@/lib/data/modpack-changelog";
import "@/components/store/store.css";

type Project = ModpackDetails & { title: string; description: string; iconUrl: string | null; url: string; categories: string[]; downloads: number; id?: string; slug?: string; projectType?: string };

export default function ModpackDetailsButton({ project, source }: { project: Project; source: "Modrinth" | "CurseForge" }) {
  const t = useTranslations("modpacks"), store = useTranslations("store"), common = useTranslations("common");
  const format = useFormatter();
  const hub = useTranslations("hub");
  const projectKey=source === "Modrinth" ? "modrinth:"+project.slug : "curseforge:"+project.id;
  const closeDetails=()=>{setOpen(false);const url=new URL(window.location.href);if(url.searchParams.get("project")===projectKey){url.searchParams.delete("project");window.history.replaceState(null,"",url);}};
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<ModpackDetails>(project);
  const [status, setStatus] = useState<"snapshot" | "loading" | "live" | "partial" | "error">("snapshot");

  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open || source === "Modrinth" && !project.slug || project.projectType === "server") return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), source === "CurseForge" ? 60000 : 10000);
    if (source === "CurseForge") {
      void fetch("/api/modpacks/changelog?project=" + encodeURIComponent(projectKey), { signal: controller.signal })
        .then(async response => {
          if (!response.ok) throw Error("UNAVAILABLE");
          const data = await response.json() as ModpackChangelogData;
          const current = data.projects.find(item => item.projectKey === projectKey);
          if (!current || current.status === "unavailable") throw Error("UNAVAILABLE");
          if (!cancelled && !controller.signal.aborted) { setDetails({ ...project, releases: current.releases }); setStatus(current.status === "live" ? "live" : "partial"); }
        })
        .catch(() => { if (!cancelled) setStatus("error"); })
        .finally(() => clearTimeout(timeout));
      return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
    }
    const get = async (path: string) => {
      const response = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(project.slug!)}/${path}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Unable to load project");
      return response.json();
    };
    // A server project may not publish downloadable versions.
    Promise.all([get(""), project.projectType === "server" ? Promise.resolve([]) : get("version")])
      .then(([data, versions]) => { if (!controller.signal.aborted) { setDetails(modrinthDetails(data, versions, project.slug!)); setStatus("live"); } })
      .catch(() => { if (!cancelled) setStatus("error"); })
      .finally(() => clearTimeout(timeout));
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [open, source, project, projectKey]);

  const queryChanged=useCallback((value:string|null)=>setOpen(value===projectKey),[projectKey]);

  const date = (value: string) => Number.isNaN(Date.parse(value)) ? value : format.dateTime(new Date(value), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  return <>
    <QueryObserver param="project" onChange={queryChanged}/>
    <button type="button" className="store-action store-details-button" data-cursor="button" aria-haspopup="dialog" aria-label={`${store("details")} — ${project.title}`} title={store("details")} onClick={() => { setStatus(project.projectType === "server" ? "snapshot" : "loading"); setOpen(true);const url=new URL(window.location.href);url.searchParams.set("project",projectKey);window.history.replaceState(null,"",url); }}><DetailsIcon /></button>
    <dialog ref={dialog} onCancel={closeDetails} onClose={closeDetails} aria-labelledby={titleId} className="checkout-shell store-checkout">
      {open && <>
        <header className="store-checkout-header"><h2 id={titleId} dir="auto" className="font-semibold">{project.title}</h2><button type="button" className="store-close" aria-label={store("close")} onClick={closeDetails}>×</button></header>
        <div className="store-checkout-body space-y-6">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {project.iconUrl && <img src={project.iconUrl} alt="" width={88} height={88} className="h-22 w-22 rounded-2xl object-cover" />}
            <div><p className="text-label">{source}</p><p className="mt-2 text-sm text-[var(--text-muted)]">{format.number(project.downloads)} {common("downloads")}</p></div>
          </div>
          <div className="hub-actions"><ShareButton path={"/modpacks?project="+encodeURIComponent(projectKey)}/></div>
          {project.projectType!=="server" && <InstallationGuide source={source} url={project.url}/>}
          <p role="status" className="text-xs text-[var(--text-muted)]">{t(status === "loading" ? "detailsLoading" : status === "live" ? "detailsLive" : status === "partial" ? "detailsPartial" : status === "error" ? "detailsFallback" : "detailsSnapshot", { source })}</p>
          <dl className="card-glow grid grid-cols-1 gap-4 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-2">
            {[[t("gameVersions"), details.gameVersions?.join(", ")], [t("loaders"), details.loaders?.join(", ")], [t("updated"), details.updated ? date(details.updated) : undefined], [t("license"), details.license]].map(([label, value]) => <div key={label}><dt className="mb-1 text-xs text-[var(--text-muted)]">{label}</dt><dd dir="auto" className="break-words text-sm">{value || t("notListed")}</dd></div>)}
          </dl>
          <section><h3 className="mb-3 font-semibold">{t("description")}</h3><div className="space-y-3 text-sm leading-7 text-[var(--text-muted)]">{readableDescription(details.body || project.description).split("\n").filter(Boolean).map((line, index) => /^[*•-]\s/.test(line) ? <p key={index} className="flex items-start gap-2"><Check size={16} className="mt-1 shrink-0 text-[var(--accent)]" aria-hidden="true" /><span dir="auto">{line.replace(/^[*•-]\s+/, "")}</span></p> : <p key={index} dir="auto" className="break-words">{line}</p>)}</div></section>
          {!!project.categories.length && <ul className="flex flex-wrap gap-2">{project.categories.map(category => <li key={category} dir="auto" className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{category}</li>)}</ul>}
          <section><h3 className="mb-3 font-semibold">{t("releases")}</h3>{details.releases?.length ? <ul className="space-y-3">{details.releases.map(release => <li key={release.url} className="card-glow rounded-xl border border-[var(--border)] p-4"><a href={release.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 text-sm font-semibold hover:text-[var(--accent)]"><span dir="auto">{release.name}</span><SolidIcon name="arrow-up-right" /></a><p className="mt-2 text-xs text-[var(--text-muted)]" dir="auto">{release.version}{release.type && ` · ${release.type}`}{release.published && ` · ${date(release.published)}`}{release.size ? ` · ${format.number(release.size / 1048576, { maximumFractionDigits: 1 })} MB` : ""}</p>{release.changelog&&<details className="mt-3"><summary className="text-sm font-semibold">{hub("changelog")}</summary><p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--text-muted)]" dir="auto">{readableDescription(release.changelog)}</p></details>}</li>)}</ul> : <p className="text-sm text-[var(--text-muted)]">{t("noRelease")}</p>}</section>
          <ProjectExtras projectKey={projectKey} title={project.title} version={details.releases?.[0]?.version}/>
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="store-action">{common("viewProject")}<SolidIcon name="arrow-up-right" /></a>
        </div>
      </>}
    </dialog>
  </>;
}
