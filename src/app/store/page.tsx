import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import SectionHeader from "@/components/ui/SectionHeader";
import StoreRanks from "@/components/store/StoreRanks";
import MagneticButton from "@/components/cursor/MagneticButton";
import { STORE_URL } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "Store — ZO7AL Projects",
  description: "Support the network and explore the official Zo7al store.",
};

export default async function StorePage() {
  const t = await getTranslations("store");

  return (
    <main data-accent="store">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} text={t("text")}>
        <MagneticButton>
          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="button"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#07080B" }}
          >
            {t("title")} →
          </a>
        </MagneticButton>
      </PageHero>

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-[1180px] px-6">
          <SectionHeader eyebrow={t("ranksEyebrow")} title={t("ranksTitle")} text={t("ranksText")} />
          <div className="mt-14">
            <StoreRanks />
          </div>
        </div>
      </section>

      <section className="relative border-t py-24 sm:py-32" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-[1180px] px-6 text-center">
          <p className="text-lg text-[var(--text-muted)]">{t("allPurchases")}</p>
          <div className="mt-7 flex justify-center">
            <MagneticButton>
              <a
                href={STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="button"
                className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold"
                style={{ borderColor: "var(--border-strong)" }}
              >
                {t("visitStore")} ↗
              </a>
            </MagneticButton>
          </div>
        </div>
      </section>
    </main>
  );
}
