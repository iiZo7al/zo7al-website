"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, DISCORD_LINK, SITE } from "@/lib/data/site";
import MagneticButton from "@/components/cursor/MagneticButton";
import BrandIcon from "@/components/ui/BrandIcon";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Reset the mobile menu when the route changes — adjusted during render
  // (React's documented pattern) rather than in an effect, so it doesn't
  // trigger an extra cascading render.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-[padding] duration-500"
      style={{ paddingTop: scrolled ? 10 : 20 }}
    >
      <nav
        className="w-[min(1180px,94vw)] flex items-center justify-between rounded-2xl border transition-all duration-500"
        style={{
          height: scrolled ? 58 : 72,
          padding: "0 18px",
          background: scrolled ? "rgba(11,13,18,0.78)" : "rgba(11,13,18,0.32)",
          borderColor: "var(--border)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <Link
          href="/"
          data-cursor="link"
          className="text-[15px] font-bold tracking-tight flex items-center gap-2"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--glow)" }}
          />
          {SITE.name}
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  data-cursor="link"
                  className="relative px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300"
                  style={{ color: active ? "var(--text)" : "var(--text-muted)" }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "var(--surface-elevated)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{t(link.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:flex items-center gap-2">
          <a
            href={DISCORD_LINK}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            className="flex items-center gap-1.5 px-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <BrandIcon slug="discord" size={15} />
            {t("discord")}
          </a>
          <LanguageSwitcher />
          <MagneticButton>
            <Link
              href="/store"
              data-cursor="button"
              className="text-sm font-semibold rounded-full px-5 py-2.5 transition-transform"
              style={{ background: "var(--accent)", color: "#07080B" }}
            >
              {t("store")}
            </Link>
          </MagneticButton>
        </div>

        <button
          className="md:hidden flex items-center justify-center p-2"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden fixed left-1/2 -translate-x-1/2 top-[86px] w-[92vw] rounded-2xl border p-3 flex flex-col gap-1"
            style={{
              background: "rgba(11,13,18,0.96)",
              borderColor: "var(--border)",
              backdropFilter: "blur(18px)",
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 rounded-xl text-base font-medium"
                style={{
                  color: pathname === link.href ? "var(--text)" : "var(--text-muted)",
                  background: pathname === link.href ? "var(--surface-elevated)" : "transparent",
                }}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="h-px my-1" style={{ background: "var(--border)" }} />
            <Link href="/store" className="px-4 py-3 rounded-xl text-base font-medium" style={{ color: "var(--text-muted)" }}>
              {t("store")}
            </Link>
            <a
              href={DISCORD_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              <BrandIcon slug="discord" size={16} />
              {t("discord")}
            </a>
            <div className="h-px my-1" style={{ background: "var(--border)" }} />
            <LanguageSwitcher variant="mobile" />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
