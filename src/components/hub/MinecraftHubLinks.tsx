import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarDays, Images, Trophy, UserRound, Vote } from "lucide-react";
import { communityCopy } from "@/lib/data/community-copy";
export default async function MinecraftHubLinks() {
  const [t,locale] = await Promise.all([getTranslations("hub"),getLocale()]);
  const c = communityCopy(locale);
  const links = [
    { label: t("player"), href: "#player", icon: UserRound },
    { label: t("events"), href: "#events", icon: CalendarDays },
    { label: c.gallery, href: "#community-gallery", icon: Images },
    { label: c.polls, href: "#community-polls", icon: Vote },
    { label: c.leaderboard, href: "#leaderboard", icon: Trophy },
  ] as const;
  return <nav className="hub-actions mt-6" aria-label={c.community}>
    {links.map(({label,href,icon:Icon}) => <Link key={href} href={href} className="hub-button" data-cursor="button"><Icon size={17} aria-hidden="true"/>{label}</Link>)}
  </nav>;
}
