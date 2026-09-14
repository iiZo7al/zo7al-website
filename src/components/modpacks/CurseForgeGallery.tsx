import { getTranslations } from "next-intl/server";
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
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="project"
              className="group flex h-full gap-5 rounded-2xl border p-6 transition-colors hover:border-[var(--border-strong)]"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
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
              <div className="flex flex-1 flex-col">
                <p className="font-semibold">{project.title}</p>
                {project.description && (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                    {project.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">
                    {project.downloads > 0 ? `${project.downloads} ${tc("downloads")}` : "\u00A0"}
                  </span>
                  <span
                    className="font-semibold transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--accent-secondary)" }}
                  >
                    {tc("viewProject")} →
                  </span>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
