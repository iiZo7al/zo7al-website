"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import DetailsIcon from "@/components/ui/DetailsIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import { modrinthDetails, readableDescription, type ModpackDetails } from "@/lib/data/modpack-details";
import "@/components/store/store.css";

type Project = ModpackDetails & { title: string; description: string; iconUrl: string | null; url: string; categories: string[]; downloads: number; slug?: string; projectType?: string };

export default function ModpackDetailsButton({ project, source }: { project: Project; source: "Modrinth" | "CurseForge" }) {
  const t = useTranslations("modpacks"), store = useTranslations("store"), common = useTranslations("common");
  const format = useFormatter();
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<ModpackDetails>(project);
  const [status, setStatus] = useState<"snapshot" | "loading" | "live" | "error">("snapshot");

  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open || source !== "Modrinth" || !project.slug) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
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
  }, [open, source, project.slug, project.projectType]);

  const date = (value: string) => Number.isNaN(Date.parse(value)) ? value : format.dateTime(new Date(value), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  return <>
    <button type="button" className="store-action store-details-button" data-cursor="button" aria-haspopup="dialog" aria-label={`${store("details")} — ${project.title}`} title={store("details")} onClick={() => { setStatus(source === "Modrinth" ? "loading" : "snapshot"); setOpen(true); }}><DetailsIcon /></button>
    <dialog ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-labelledby={titleId} className="checkout-shell store-checkout">
      {open && <>
        <header className="store-checkout-header"><h2 id={titleId} dir="auto" className="font-semibold">{project.title}</h2><button type="button" className="store-close" aria-label={store("close")} onClick={() => setOpen(false)}>×</button></header>
        <div className="store-checkout-body space-y-6">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {project.iconUrl && <img src={project.iconUrl} alt="" width={88} height={88} className="h-22 w-22 rounded-2xl object-cover" />}
            <div><p className="text-label">{source}</p><p className="mt-2 text-sm text-[var(--text-muted)]">{format.number(project.downloads)} {common("downloads")}</p></div>
          </div>
          <p role="status" className="text-xs text-[var(--text-muted)]">{t(status === "loading" ? "detailsLoading" : status === "live" ? "detailsLive" : status === "error" ? "detailsFallback" : "detailsSnapshot")}</p>
          <dl className="card-glow grid grid-cols-1 gap-4 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-2">
            {[[t("gameVersions"), details.gameVersions?.join(", ")], [t("loaders"), details.loaders?.join(", ")], [t("updated"), details.updated ? date(details.updated) : undefined], [t("license"), details.license]].map(([label, value]) => <div key={label}><dt className="mb-1 text-xs text-[var(--text-muted)]">{label}</dt><dd dir="auto" className="break-words text-sm">{value || t("notListed")}</dd></div>)}
          </dl>
          <section><h3 className="mb-3 font-semibold">{t("description")}</h3><div className="space-y-3 text-sm leading-7 text-[var(--text-muted)]">{readableDescription(details.body || project.description).split("\n").filter(Boolean).map((line, index) => /^[*•-]\s/.test(line) ? <p key={index} className="flex items-start gap-2"><Check size={16} className="mt-1 shrink-0 text-[var(--accent)]" aria-hidden="true" /><span dir="auto">{line.replace(/^[*•-]\s+/, "")}</span></p> : <p key={index} dir="auto" className="break-words">{line}</p>)}</div></section>
          {!!project.categories.length && <ul className="flex flex-wrap gap-2">{project.categories.map(category => <li key={category} dir="auto" className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{category}</li>)}</ul>}
          <section><h3 className="mb-3 font-semibold">{t("releases")}</h3>{details.releases?.length ? <ul className="space-y-3">{details.releases.map(release => <li key={release.url} className="card-glow rounded-xl border border-[var(--border)] p-4"><a href={release.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 text-sm font-semibold hover:text-[var(--accent)]"><span dir="auto">{release.name}</span><SolidIcon name="arrow-up-right" /></a><p className="mt-2 text-xs text-[var(--text-muted)]" dir="auto">{release.version}{release.type && ` · ${release.type}`}{release.published && ` · ${date(release.published)}`}{release.size ? ` · ${format.number(release.size / 1048576, { maximumFractionDigits: 1 })} MB` : ""}</p></li>)}</ul> : <p className="text-sm text-[var(--text-muted)]">{t("noRelease")}</p>}</section>
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="store-action">{common("viewProject")}<SolidIcon name="arrow-up-right" /></a>
        </div>
      </>}
    </dialog>
  </>;
}
