"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Gamepad2, History } from "lucide-react";
import BrandIcon from "@/components/ui/BrandIcon";
import SolidIcon from "@/components/ui/SolidIcon";
import { SOCIALS } from "@/lib/data/site";

export type MenuKey = "minecraft" | "socials" | "support";
export const MENU_ICONS = { minecraft: "cube", socials: "share", support: "headset" } as const;
export function hasSubmenu(key: string): key is MenuKey {
  return key === "minecraft" || key === "socials" || key === "support";
}

export default function NavigationMenu({
  menu, id, pathname, onNavigate, compact = false,
}: {
  menu: MenuKey;
  id: string;
  pathname: string;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const nav = useTranslations("nav");
  const hub = useTranslations("hub");
  const minecraft = useTranslations("minecraft");
  const modpacks = useTranslations("modpacks");
  const socials = useTranslations("socials");
  const intro = menu === "minecraft" ? minecraft("text") : menu === "socials" ? socials("text") : hub("supportIntro");
  const links = menu === "minecraft" ? [
    { href: "/minecraft", label: minecraft("title"), description: minecraft("connectText"), icon: "cube" as const },
    { href: "/modpacks", label: nav("modpacks"), description: modpacks("text"), icon: "box" as const },
  ] : [
    { href: "/support", label: hub("support"), description: hub("supportIntro"), icon: "headset" as const },
    { href: "/requests", label: hub("activity"), description: hub("activityIntro"), icon: null },
  ];

  return (
    <div id={id} className={`navigation-menu navigation-menu-${menu}${compact ? " navigation-menu-compact" : ""}`} aria-labelledby={`${id}-title`}>
      {!compact && <aside className="navigation-menu-intro">
        <span className="navigation-menu-symbol" aria-hidden="true">
          {menu === "minecraft" ? <Image src="/assets/site/server-logo.png" width={72} height={72} alt=""/> : <SolidIcon name={MENU_ICONS[menu]} size={32}/>}
        </span>
        <p className="text-label">ZO7AL PROJECTS</p>
        <h2 id={`${id}-title`}>{nav(menu)}</h2>
        <p>{intro}</p>
        {menu === "socials" && <Link href="/socials#games-socials-title" onClick={onNavigate} className="navigation-games-link" data-cursor="link"><Gamepad2 size={18} aria-hidden="true"/>Zo7al Games<ArrowUpRight size={14} aria-hidden="true"/></Link>}
      </aside>}
      {compact && <h3 id={`${id}-title`} className="sr-only">{nav(menu)}</h3>}
      <ul className="navigation-menu-links">
        {menu === "socials" ? SOCIALS.map(social => <li key={social.id}>
          <a href={social.url} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className="navigation-menu-link navigation-platform" data-cursor="link">
            <span className="navigation-link-icon"><BrandIcon slug={social.id} size={22}/></span>
            <span className="navigation-link-copy"><span className="navigation-link-title" dir="auto">{social.label}</span><span className="navigation-link-description" dir="auto">{social.handle}</span></span>
            <ArrowUpRight size={14} className="navigation-link-arrow" aria-hidden="true"/>
          </a>
        </li>) : links.map(item => <li key={item.href}>
          <Link href={item.href} onClick={onNavigate} aria-current={pathname === item.href ? "page" : undefined} className="navigation-menu-link" data-cursor="link">
            <span className="navigation-link-icon">{item.icon ? <SolidIcon name={item.icon} size={23}/> : <History size={23} aria-hidden="true"/>}</span>
            <span className="navigation-link-copy"><span className="navigation-link-title">{item.label}</span><span className="navigation-link-description">{item.description}</span></span>
            <ArrowUpRight size={17} className="navigation-link-arrow" aria-hidden="true"/>
          </Link>
        </li>)}
      </ul>
      {compact && menu === "socials" && <Link href="/socials#games-socials-title" onClick={onNavigate} className="navigation-games-link" data-cursor="link"><Gamepad2 size={18} aria-hidden="true"/>Zo7al Games<ArrowUpRight size={14} aria-hidden="true"/></Link>}
    </div>
  );
}
