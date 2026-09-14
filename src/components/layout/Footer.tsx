import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NAV_LINKS, SITE, STORE_LINK } from "@/lib/data/site";
import BrandIcon from "@/components/ui/BrandIcon";
import { ShoppingBag } from "lucide-react";
import { getSyncedSocials } from "@/lib/sync/socials";

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
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  {t(`nav.${l.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-label mb-4">{t("footer.platformsLabel")}</p>
          <ul className="flex flex-col gap-3">
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
                <ShoppingBag size={14} />
                Store
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
      </div>
    </footer>
  );
}
