import Link from "next/link";
import { getTranslations } from "next-intl/server";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import ProjectArt from "./ProjectArt";

const PROJECT_IDS = ["minecraft", "modpacks", "fortnite"] as const;
const VARIANTS = { minecraft: "minecraft", modpacks: "modpacks", fortnite: "fortnite" } as const;
const HREFS = { minecraft: "/minecraft", modpacks: "/modpacks", fortnite: "/fortnite" } as const;

export default async function UniverseShowcase() {
  const t = await getTranslations("home");

  return (
    <section id="universe" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-[1180px] px-6">
        <SectionHeader
          eyebrow={t("universeEyebrow")}
          title={t("universeTitle")}
          text={t("universeText")}
        />

        <div className="mt-20 flex flex-col gap-28">
          {PROJECT_IDS.map((id, i) => {
            const reversed = i % 2 === 1;
            return (
              <Reveal key={id} delay={0.05}>
                <Link
                  href={HREFS[id]}
                  data-cursor="project"
                  className="group grid items-center gap-10 md:grid-cols-2 md:gap-16"
                >
                  <div className={reversed ? "md:order-2" : ""}>
                    <ProjectArt variant={VARIANTS[id]} />
                  </div>
                  <div className={reversed ? "md:order-1" : ""}>
                    <div className="flex items-center gap-3 text-label">
                      <span style={{ color: "var(--accent)" }}>{t(`${id}Meta1`)}</span>
                      <span style={{ color: "var(--accent)" }}>{t(`${id}Meta2`)}</span>
                    </div>
                    <h3 className="text-display mt-5 text-3xl sm:text-4xl md:text-5xl">
                      {t(`${id}Title`)}
                    </h3>
                    <p className="mt-5 max-w-md text-lg text-[var(--text-muted)]">{t(`${id}Text`)}</p>
                    <span
                      className="mt-8 inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3"
                      style={{ color: "var(--accent)" }}
                    >
                      {t(`${id}Cta`)}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="rtl:-scale-x-100"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
