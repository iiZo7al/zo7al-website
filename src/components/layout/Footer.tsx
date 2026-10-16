import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NAV_LINKS, SITE, STORE_LINK } from "@/lib/data/site";
import BrandIcon, { brandLabelStyle } from "@/components/ui/BrandIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import { getSyncedSocials, getSyncedGamesSocials } from "@/lib/sync/socials";
import BrandName from "./BrandName";

const FOOTER_ICONS = { home: "home", minecraft: "cube", modpacks: "box", fortnite: "map", socials: "share", support: "headset", store: "shopping-bag" } as const;

export default async function Footer() {
  const [t, { items: socials }, { items: gamesSocials }] = await Promise.all([
    getTranslations(),
    getSyncedSocials(),
    getSyncedGamesSocials(),
  ]);

  return (
    <>
      {/* Preserve the artwork and placement from pull request #111. */}
      <div
        className="site-footer-horizon relative w-full overflow-hidden"
        aria-hidden="true"
        style={{ height: "clamp(190px, 31vw, 350px)", background: "#07080b" }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="footer-horizon-far" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#15171c" stopOpacity=".48" />
              <stop offset="1" stopColor="#0b0d11" stopOpacity=".82" />
            </linearGradient>
            <linearGradient id="footer-horizon-near" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#171a20" stopOpacity=".72" />
              <stop offset="1" stopColor="#0c0e13" stopOpacity=".96" />
            </linearGradient>
          </defs>
          <path d="M0 170 C190 145 360 137 520 105 C690 70 810 67 970 87 C1150 110 1305 147 1440 169 V320 H0 Z" fill="url(#footer-horizon-far)" />
          <path d="M0 207 C188 181 355 193 520 157 C694 119 842 127 1006 148 C1191 171 1300 189 1440 211 V320 H0 Z" fill="#0d0f14" fillOpacity=".86" />
          <path d="M0 250 C205 225 343 238 523 211 C706 183 840 192 1003 208 C1184 226 1310 246 1440 260 V320 H0 Z" fill="url(#footer-horizon-near)" />
          <path d="M0 282 C182 263 335 269 501 252 C709 231 849 242 1030 256 C1192 269 1314 282 1440 291 V320 H0 Z" fill="#101217" fillOpacity=".88" />
        </svg>
      </div>
      <footer className="site-footer relative border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-[1600px] px-6 py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_.7fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            <BrandName name={SITE.name} />
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
                  <span style={brandLabelStyle(s.platform)}>{s.label}</span>
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

        <div aria-labelledby="footer-games-title">
          <p id="footer-games-title" className="text-label mb-4">Zo7al Games</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {gamesSocials.map((social) => (
              <li key={social.id}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                  aria-label={`Zo7al Games · ${social.label}`}
                  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  <BrandIcon slug={social.platform} size={14} />
                  <span style={brandLabelStyle(social.platform)}>{social.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="mx-auto max-w-[1600px] px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t text-xs text-[var(--text-muted)]"
        style={{ borderColor: "var(--border)" }}
      >
        <p>© {SITE.year} {t("footer.copyright")}</p>
        <p>{t("footer.disclaimer")}</p>
        <a href="https://www.flaticon.com/uicons" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{t("footer.iconCredit")}</a>
      </div>
    </footer>
    </>
  );
}

