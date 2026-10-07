import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Headset, UserRound } from "lucide-react";
export default async function MinecraftHubLinks() {
  const t = await getTranslations("hub");
  const links = [
    { key: "player", href: "#player", icon: UserRound },
    { key: "events", href: "#events", icon: CalendarDays },
    { key: "support", href: "/support", icon: Headset },
  ] as const;
  return <nav className="hub-actions mt-6" aria-label={t("player")}>
    {links.map(({key,href,icon:Icon}) => <Link key={key} href={href} className="hub-button" data-cursor="button"><Icon size={17} aria-hidden="true"/>{t(key)}</Link>)}
  </nav>;
}
