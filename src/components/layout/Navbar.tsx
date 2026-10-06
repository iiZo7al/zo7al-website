"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import SolidIcon from "@/components/ui/SolidIcon";
import { NAV_LINKS, DISCORD_LINK, SITE } from "@/lib/data/site";
import { SearchTrigger } from "@/components/hub/CommandSearch";
import StoreNavAction from "@/components/store/StoreNavAction";
import MagneticButton from "@/components/cursor/MagneticButton";
import BrandIcon from "@/components/ui/BrandIcon";
import { ChevronDown, ArrowUpRight, History } from "lucide-react";
import { SOCIALS } from "@/lib/data/site";
import "./navigation.css";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

type MenuKey = "minecraft" | "socials" | "support";
const TOP_LINKS = NAV_LINKS.filter(link => link.key !== "modpacks");
const isMenu = (key: string): key is MenuKey => ["minecraft", "socials", "support"].includes(key);
const ICON_MAP = { home: "home", minecraft: "cube", modpacks: "box", fortnite: "map", socials: "share", support: "headset" } as const;

export default function Navbar() {

  const locale = useLocale();
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const hub = useTranslations("hub");
  const reducedMotion = useReducedMotion();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = useRef<Partial<Record<MenuKey, HTMLButtonElement | null>>>({});
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const open = (key: MenuKey) => { cancelClose(); setOpenMenu(key); };
  const close = () => { cancelClose(); setOpenMenu(null); };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => setOpenMenu(null), 180); };
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const ui = useTranslations("ui");
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
    setOpenMenu(null);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submenu = (key: MenuKey) => key === "socials" ? SOCIALS.map(social => (
    <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" className="mega-card" data-cursor="link" onClick={() => { close(); setMobileOpen(false); }}>
      <span className="mega-icon"><BrandIcon slug={social.id} size={23}/></span>
      <span className="mega-card-copy"><strong>{social.label}</strong><span dir="ltr">{social.handle}</span></span><ArrowUpRight size={16} aria-hidden="true"/>
    </a>
  )) : (key === "minecraft" ? [
    { href: "/minecraft", label: locale === "ar" ? "شبكة زحل" : "Zo7al Network", icon: "cube" as const },
    { href: "/modpacks", label: t("modpacks"), icon: "box" as const },
  ] : [
    { href: "/support", label: hub("support"), icon: "headset" as const },
    { href: "/requests", label: hub("activity"), icon: null },
  ]).map(item => (
    <Link key={item.href} href={item.href} className="mega-card" data-cursor="link" onClick={() => { close(); setMobileOpen(false); }} aria-current={pathname === item.href ? "page" : undefined}>
      <span className="mega-icon">{item.icon ? <SolidIcon name={item.icon} size={24}/> : <History size={24} aria-hidden="true"/>}</span>
      <strong className="mega-card-copy">{item.label}</strong><ArrowUpRight size={16} aria-hidden="true"/>
    </Link>
  ));

  return (
    <header
      onKeyDown={event => { if (event.key === "Escape") { const key = openMenu; close(); if (mobileOpen) { setMobileOpen(false); mobileTrigger.current?.focus(); } else if (key) triggerRefs.current[key]?.focus(); } }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-[padding] duration-500"
      style={{ paddingTop: scrolled ? 10 : 20 }}
    >
      <nav
        aria-label={SITE.name}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}
        className="relative z-10 w-[min(1180px,94vw)] flex items-center justify-between rounded-2xl border transition-all duration-500"
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

        <ul className="hidden xl:flex items-center gap-1">
          <li><SearchTrigger/></li>
          {TOP_LINKS.map((link) => {
            const active = pathname === link.href || (link.key === "minecraft" && pathname === "/modpacks") || (link.key === "support" && pathname === "/requests");
            return (
              <li key={link.href} className="flex items-center" onMouseEnter={() => isMenu(link.key) ? open(link.key) : close()} onMouseLeave={scheduleClose}>
                <Link
                  href={link.href}
                  data-cursor="link"
                  onClick={close}
                  onFocus={() => { if (isMenu(link.key)) open(link.key); }}
                  aria-current={active ? "page" : undefined}
                  className="relative px-3 py-2 text-sm font-medium rounded-full transition-colors duration-300 flex items-center gap-2"
                  style={{ color: openMenu === link.key ? "var(--accent)" : active ? "var(--text)" : "var(--text-muted)" }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "var(--surface-elevated)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {(() => {
                      const Icon = ICON_MAP[link.key];
                      return Icon ? <SolidIcon name={Icon} size={14} /> : null;
                    })()}
                    {t(link.key)}
                  </span>
                </Link>
                {isMenu(link.key) && <button type="button" ref={node => { triggerRefs.current[link.key as MenuKey] = node; }} className="mega-toggle" aria-label={`${ui("openMenu")} — ${t(link.key)}`} aria-expanded={openMenu === link.key} aria-controls={`mega-${link.key}`} onClick={() => openMenu === link.key ? close() : open(link.key as MenuKey)}><ChevronDown size={13} aria-hidden="true"/></button>}
              </li>
            );
          })}
        </ul>

        <div className="ms-auto me-2 xl:hidden"><SearchTrigger/></div>
        <div className="hidden xl:flex items-center gap-2">
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
            <StoreNavAction />
          </MagneticButton>
        </div>

        <button
          ref={mobileTrigger}
          className="xl:hidden flex items-center justify-center p-2"
          aria-label={ui(mobileOpen ? "closeMenu" : "openMenu")}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => { close(); setMobileOpen((v) => !v); }}
        >
          <SolidIcon name={mobileOpen ? "cross" : "menu-burger"} size={20} />
        </button>
        <AnimatePresence>
          {openMenu && !mobileOpen && <motion.div key={openMenu} id={`mega-${openMenu}`} className={`mega-panel hidden xl:block mega-panel-${openMenu}`} initial={{ opacity: 0, y: reducedMotion ? 0 : -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }} transition={{ duration: .18 }} onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            <div className="mega-heading"><SolidIcon name={ICON_MAP[openMenu]} size={19}/><h2>{t(openMenu)}</h2><button type="button" className="mega-close" aria-label={ui("closeMenu")} onClick={close}><SolidIcon name="cross" size={14}/></button></div>
            <div className="mega-grid">{submenu(openMenu)}</div>
          </motion.div>}
        </AnimatePresence>
      </nav>
      <AnimatePresence>{(mobileOpen || openMenu) && <motion.div className={`mega-backdrop ${mobileOpen ? "" : "hidden xl:block"}`} aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { close(); setMobileOpen(false); }}/>}</AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            id="mobile-navigation"
            className="mobile-nav-panel mega-mobile z-10 xl:hidden fixed left-1/2 -translate-x-1/2 top-[86px] w-[92vw] rounded-2xl border p-3 flex flex-col gap-1"
            style={{
              background: "rgba(11,13,18,0.96)",
              borderColor: "var(--border)",
              backdropFilter: "blur(18px)",
            }}
          >
            {TOP_LINKS.map((link) => {
              const Icon = ICON_MAP[link.key];
              return (
                <div key={link.href}><div className="flex items-center">
                <Link
                  onClick={() => { close(); setMobileOpen(false); }}
                  href={link.href}
                  className="flex flex-1 items-center gap-3 px-4 py-3 rounded-xl text-base font-medium"
                  style={{
                    color: pathname === link.href ? "var(--text)" : "var(--text-muted)",
                    background: pathname === link.href ? "var(--surface-elevated)" : "transparent",
                  }}
                >
                  {Icon && <SolidIcon name={Icon} size={18} />}
                  {t(link.key)}
                </Link>
                {isMenu(link.key) && <button type="button" className="mega-toggle mobile-toggle" aria-label={`${ui("openMenu")} — ${t(link.key)}`} aria-expanded={openMenu === link.key} aria-controls={`mobile-${link.key}`} onClick={() => openMenu === link.key ? close() : open(link.key as MenuKey)}><ChevronDown size={18} aria-hidden="true"/></button>}
                </div>{isMenu(link.key) && openMenu === link.key && <div id={`mobile-${link.key}`} className="mega-mobile-items">{submenu(link.key)}</div>}</div>
              );
            })}
            <div className="h-px my-1" style={{ background: "var(--border)" }} />
            <StoreNavAction mobile onActivate={() => setMobileOpen(false)} />
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

