import { getTranslations } from "next-intl/server";
import SectionHeader from "@/components/ui/SectionHeader";
import FaqAccordion, { type FaqItem } from "./FaqAccordion";

export default async function FaqSection() {
  const [t, tc] = await Promise.all([getTranslations("faq"), getTranslations("common")]);
  const items = t.raw("items") as FaqItem[];
  const categories = t.raw("categories") as Record<string, string>;

  return (
    <section className="relative overflow-hidden border-t py-28 sm:py-36" style={{ borderColor: "var(--border)" }}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-[110px]"
          style={{ background: "var(--glow)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[820px] px-6">
        <SectionHeader
          align="center"
          eyebrow={t("eyebrow")}
          title={t("title")}
          text={t("text")}
        />
        <div className="mt-14">
          <FaqAccordion
            items={items}
            categories={categories}
            searchPlaceholder={t("searchPlaceholder")}
            noResults={t("noResults")}
            allLabel={tc("all")}
          />
        </div>
      </div>
    </section>
  );
}
