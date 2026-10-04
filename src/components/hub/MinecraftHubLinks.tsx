import Link from "next/link";
import { getTranslations } from "next-intl/server";
export default async function MinecraftHubLinks() {
  const t = await getTranslations("hub");
  const links = [
    { key: "player", href: "/minecraft#player" },
    { key: "events", href: "/minecraft#events" },
    { key: "support", href: "/support" },
  ];
  return <div className="hub-page-inner pb-12"><div className="hub-actions">{links.map(({key,href}) => <Link key={key} href={href} className="hub-button">{t(key)}</Link>)}</div></div>;
}
