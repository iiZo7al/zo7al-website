import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import MikuManga, { type MikuChapter } from "@/components/miku/MikuManga";
import "@/components/miku/miku.css";

export const metadata: Metadata = {
  title: "Zo7al & Miku",
  description: "An original manga story starring Zo7al and Hatsune Miku.",
  robots: { index: false, follow: false },
};

export default async function MikuPage() {
  const t = await getTranslations("miku");
  const pages = t.raw("pages") as MikuChapter[];

  return (
    <main data-accent="miku" className="miku-page-root">
      <MikuManga
        intro={t("intro")}
        scrollHint={t("scrollHint")}
        pageLabel={t("pageLabel")}
        endingTitle={t("endingTitle")}
        endingText={t("endingText")}
        pages={pages}
      />
    </main>
  );
}
