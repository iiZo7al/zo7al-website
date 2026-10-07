import { getTranslations } from "next-intl/server";
import ModpackDetailsButton from "./ModpackDetailsButton";
import { ProjectStatus } from "@/components/community/ProjectExtras";
import SolidIcon from "@/components/ui/SolidIcon";
import Reveal from "@/components/ui/Reveal";
import { CURSEFORGE_PROFILE_URL, type CurseForgeProject } from "@/lib/data/curseforge";

export default async function CurseForgeGallery({
  projects,
  source,
}: {
  projects: CurseForgeProject[];
  source: "live" | "fallback";
}) {
  const [t, tc] = await Promise.all([getTranslations("modpacks"), getTranslations("common")]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <p className="text-label">{source === "live" ? t("curseforgeLiveLabel") : t("curseforgeLabel")}</p>
        <a
          href={CURSEFORGE_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="link"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          {tc("viewProfile")} ↗
        </a>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal key={project.id} delay={i * 0.05}>
            <article
              className="card-glow group relative flex h-full gap-5 rounded-2xl border p-6 pt-12 transition-colors hover:border-[var(--border-strong)]"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`${tc("viewProject")} — ${project.title}`} className="absolute left-5 top-5 text-[var(--text-muted)] transition-transform hover:-translate-y-1"><SolidIcon name="arrow-up-right" size={16} /></a>
              {project.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.iconUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="h-14 w-14 shrink-0 rounded-xl"
                  style={{ background: "var(--surface-elevated)" }}
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-semibold">{project.title}</p>
                <ProjectStatus projectKey={'curseforge:'+project.id}/>
                {project.description && (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                    {project.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--text-muted)]">
                    {project.downloads > 0 ? `${project.downloads} ${tc("downloads")}` : "\u00A0"}
                  </span>
                  <a href={project.url} target="_blank" rel="noopener noreferrer"
                    className="font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--accent-secondary)" }}
                  >
                    {tc("viewProject")} →
                  </a>
                  <ModpackDetailsButton project={project} source="CurseForge" />
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
