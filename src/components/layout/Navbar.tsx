"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import SolidIcon from "@/components/ui/SolidIcon";
import BrandIcon from "@/components/ui/BrandIcon";
import { NAV_LINKS, DISCORD_LINK, SITE } from "@/lib/data/site";
import { SearchTrigger } from "@/components/hub/CommandSearch";
import StoreNavAction from "@/components/store/StoreNavAction";
import MagneticButton from "@/components/cursor/MagneticButton";
import LanguageSwitcher from "./LanguageSwitcher";
import NavigationMenu, { hasSubmenu, type MenuKey } from "./NavigationMenu";
import "./navigation.css";

const TOP_LINKS = NAV_LINKS.filter(link => link.key !== "modpacks");
const ICONS = { home: "home", minecraft: "cube", fortnite: "map", socials: "share", support: "headset", modpacks: "box" } as const;
const FOCUSABLE = 'a[href], button:not([disabled])';
const EASE = [0.16, 1, 0.3, 1] as const;

function MenuSurface({ children, mobile = false }: { children: ReactNode; mobile?: boolean }) {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  return <motion.div className={mobile ? "navigation-mobile" : "navigation-menu-shell"} inert={!present} aria-hidden={!present || undefined}
    initial={{ opacity: 0, y: reduced ? 0 : -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -4 }} transition={{ duration: reduced ? 0 : .18, ease: EASE }}>
    {children}
  </motion.div>;
}

function activeSection(key: string, href: string, pathname: string) {
  return pathname === href || (key === "minecraft" && pathname === "/modpacks") || (key === "support" && pathname === "/requests");
}

export default function Navbar() {
  const pathname = usePathname();
  const nav = useTranslations("nav");
  const ui = useTranslations("ui");
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<MenuKey | null>(null);
  const [previousPath, setPreviousPath] = useState(pathname);
  const header = useRef<HTMLElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const desktopTriggers = useRef<Partial<Record<MenuKey, HTMLButtonElement | null>>>({});
  const mobileTriggers = useRef<Partial<Record<MenuKey, HTMLButtonElement | null>>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusIntent = useRef<"first" | "last" | null>(null);

  // Close navigation before rendering a different route.
  if (pathname !== previousPath) {
    setPreviousPath(pathname);
    setDesktopMenu(null);
    setMobileOpen(false);
    setMobileGroup(null);
  }

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const closeAll = useCallback(() => {
    cancelClose();
    focusIntent.current = null;
    setDesktopMenu(null);
    setMobileOpen(false);
    setMobileGroup(null);
  }, [cancelClose]);
  const focusMenu = useCallback((menu: MenuKey, position: "first" | "last") => {
    const items = header.current?.querySelector(`#navigation-desktop-${menu}`)?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (items?.length) items[position === "first" ? 0 : items.length - 1].focus();
    focusIntent.current = null;
  }, []);
  const openDesktop = (menu: MenuKey, focus?: "first" | "last") => {
    cancelClose();
    focusIntent.current = focus ?? null;
    setDesktopMenu(menu);
    // The menu may already be open from a pointer hover.
    if (focus && desktopMenu === menu) focusMenu(menu, focus);
  };
  const scheduleClose = (menu: MenuKey) => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      // Moving the pointer does not dismiss a menu being used by keyboard.
      const group = header.current?.querySelector(`[data-navigation-group="${menu}"]`);
      if (!group?.contains(document.activeElement)) setDesktopMenu(null);
    }, 180);
  };
  const menuKeyDown = (event: KeyboardEvent<HTMLElement>, menu: MenuKey) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    openDesktop(menu, event.key === "ArrowDown" ? "first" : "last");
  };

  useEffect(() => {
    if (desktopMenu && focusIntent.current) focusMenu(desktopMenu, focusIntent.current);
  }, [desktopMenu, focusMenu]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const onViewportChange = () => closeAll();
    const desktop = window.matchMedia("(min-width: 1280px)");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    desktop.addEventListener("change", onViewportChange);
    return () => {
      cancelClose();
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", onViewportChange);
    };
  }, [cancelClose, closeAll]);

  return <header ref={header} className={`site-navigation${scrolled ? " site-navigation-scrolled" : ""}`}
    onFocus={event => {
      const group = (event.target as Element).closest("[data-navigation-group]");
      if (desktopMenu && group?.getAttribute("data-navigation-group") !== desktopMenu) { cancelClose(); setDesktopMenu(null); }
    }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeAll(); }}
    onKeyDown={event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      cancelClose();
      if (mobileOpen && mobileGroup) {
        setMobileGroup(null);
        mobileTriggers.current[mobileGroup]?.focus();
      } else if (mobileOpen) {
        closeAll();
        mobileTrigger.current?.focus();
      } else if (desktopMenu) {
        setDesktopMenu(null);
        desktopTriggers.current[desktopMenu]?.focus();
      }
    }}>
    <div className="site-navigation-bar">
      <nav className="site-navigation-inner" aria-label={SITE.name}>
        <Link href="/" onClick={closeAll} className="site-navigation-brand" data-cursor="link"><span aria-hidden="true"/>{SITE.name}</Link>
        <ul className="site-navigation-links">
          <li><SearchTrigger/></li>
          {TOP_LINKS.map(link => {
            const menu = hasSubmenu(link.key) ? link.key : null;
            const active = activeSection(link.key, link.href, pathname);
            return <li key={link.key} className="site-navigation-group" data-navigation-group={link.key}
              onMouseEnter={() => { if (menu) openDesktop(menu); else { cancelClose(); setDesktopMenu(null); } }}
              onMouseLeave={() => { if (menu) scheduleClose(menu); }}>
              <div className={`site-navigation-item${active ? " is-active" : ""}${desktopMenu === menu && menu ? " is-expanded" : ""}`}>
                <Link href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={closeAll} onKeyDown={event => { if (menu) menuKeyDown(event, menu); }} data-cursor="link">
                  <SolidIcon name={ICONS[link.key]} size={14}/><span>{nav(link.key)}</span>
                </Link>
                {menu && <button type="button" className="navigation-disclosure" ref={node => { desktopTriggers.current[menu] = node; }}
                  aria-label={`${ui(desktopMenu === menu ? "closeMenu" : "openMenu")}: ${nav(menu)}`} aria-expanded={desktopMenu === menu} aria-controls={`navigation-desktop-${menu}`} data-cursor="button"
                  onKeyDown={event => menuKeyDown(event, menu)} onClick={event => { if (desktopMenu === menu) { cancelClose(); setDesktopMenu(null); } else openDesktop(menu, event.detail === 0 ? "first" : undefined); }}><ChevronDown size={13} aria-hidden="true"/></button>}
              </div>
              <AnimatePresence initial={false}>{menu && desktopMenu === menu && <MenuSurface><NavigationMenu id={`navigation-desktop-${menu}`} menu={menu} pathname={pathname} onNavigate={closeAll}/></MenuSurface>}</AnimatePresence>
            </li>;
          })}
        </ul>
        <div className="site-navigation-tools">
          <a href={DISCORD_LINK} onClick={closeAll} target="_blank" rel="noopener noreferrer" className="navigation-discord" aria-label={nav("discord")} data-cursor="link"><BrandIcon slug="discord" size={19}/></a>
          <div onFocus={() => { cancelClose(); setDesktopMenu(null); }} onMouseEnter={() => { cancelClose(); setDesktopMenu(null); }}><LanguageSwitcher/></div>
          <MagneticButton><StoreNavAction onActivate={closeAll}/></MagneticButton>
        </div>
        <div className="site-navigation-mobile-tools"><SearchTrigger/><button ref={mobileTrigger} type="button" className="navigation-mobile-trigger" aria-label={ui(mobileOpen ? "closeMenu" : "openMenu")} aria-expanded={mobileOpen} aria-controls="navigation-mobile-panel" data-cursor="button" onClick={() => { cancelClose(); setDesktopMenu(null); setMobileGroup(null); setMobileOpen(!mobileOpen); }}><SolidIcon name={mobileOpen ? "cross" : "menu-burger"} size={20}/></button></div>
      </nav>
      <AnimatePresence initial={false}>{mobileOpen && <MenuSurface mobile>
        <nav id="navigation-mobile-panel" aria-label={SITE.name}>
          <ul className="navigation-mobile-links">{TOP_LINKS.map(link => {
            const menu = hasSubmenu(link.key) ? link.key : null;
            return <li key={link.key}>
              <div className={`navigation-mobile-row${activeSection(link.key, link.href, pathname) ? " is-active" : ""}`}>
                <Link href={link.href} onClick={closeAll} aria-current={pathname === link.href ? "page" : undefined} data-cursor="link"><SolidIcon name={ICONS[link.key]} size={18}/>{nav(link.key)}</Link>
                {menu && <button ref={node => { mobileTriggers.current[menu] = node; }} type="button" className="navigation-disclosure" aria-label={`${ui(mobileGroup === menu ? "closeMenu" : "openMenu")}: ${nav(menu)}`} aria-expanded={mobileGroup === menu} aria-controls={`navigation-mobile-${menu}`} data-cursor="button" onClick={() => setMobileGroup(mobileGroup === menu ? null : menu)}><ChevronDown size={18} aria-hidden="true"/></button>}
              </div>
              {menu && mobileGroup === menu && <NavigationMenu compact id={`navigation-mobile-${menu}`} menu={menu} pathname={pathname} onNavigate={closeAll}/>}
            </li>;
          })}</ul>
          <div className="navigation-mobile-actions"><StoreNavAction mobile onActivate={closeAll}/><a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" onClick={closeAll} className="navigation-mobile-discord" data-cursor="link"><BrandIcon slug="discord" size={18}/>{nav("discord")}</a></div>
          <LanguageSwitcher variant="mobile"/>
        </nav>
      </MenuSurface>}</AnimatePresence>
    </div>
    <AnimatePresence initial={false}>{(desktopMenu || mobileOpen) && <motion.div className="navigation-backdrop" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .18 }} onMouseDown={event => event.preventDefault()} onClick={closeAll}/>}</AnimatePresence>
  </header>;
}
