import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NAV_LINKS, SITE, STORE_LINK } from "@/lib/data/site";
import BrandIcon from "@/components/ui/BrandIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import { getSyncedSocials } from "@/lib/sync/socials";

const FOOTER_ICONS = { home: "home", minecraft: "cube", modpacks: "box", fortnite: "map", socials: "share", store: "shopping-bag" } as const;

export default async function Footer() {
  const [t, { items: socials }] = await Promise.all([
    getTranslations(),
    getSyncedSocials(),
  ]);

  return (
    <footer className="relative border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1180px] px-6 py-16 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            {SITE.name}
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <p className="text-label mb-4">{t("footer.siteLabel")}</p>
          <ul className="flex flex-col gap-3">
            {[...NAV_LINKS, { key: "store" as const, label: "Store", href: "/store" }].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  data-cursor="link"
                  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  <SolidIcon name={FOOTER_ICONS[l.key]} size={15} className="shrink-0" />
                  {t(`nav.${l.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-label mb-4">{t("footer.platformsLabel")}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {socials.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  <BrandIcon slug={s.platform} size={14} />
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={STORE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <SolidIcon name="shopping-bag" size={14} />
                {t("nav.store")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div
        className="mx-auto max-w-[1180px] px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t text-xs text-[var(--text-muted)]"
        style={{ borderColor: "var(--border)" }}
      >
        <p>© {SITE.year} {t("footer.copyright")}</p>
        <p>{t("footer.disclaimer")}</p>
        <a href="https://www.flaticon.com/uicons" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Uicons by Flaticon</a>
      </div>
    </footer>
  );
}

