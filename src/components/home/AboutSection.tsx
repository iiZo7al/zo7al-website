import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";

export default async function AboutSection() {
  const t = await getTranslations("home");

  return (
    <section className="relative border-t py-28 sm:py-36" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.6fr] md:gap-20">
          <Reveal>
            <p className="text-label" style={{ color: "var(--accent)" }}>
              {t("aboutEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-display text-3xl sm:text-4xl md:text-5xl">{t("aboutText")}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
