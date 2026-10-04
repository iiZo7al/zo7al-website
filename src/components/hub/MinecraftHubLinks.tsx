import Link from "next/link";
import { getTranslations } from "next-intl/server";
export default async function MinecraftHubLinks(){const t=await getTranslations("hub");return <div className="hub-page-inner pb-12"><div className="hub-actions">{(["player","events","support"] as const).map(key=><Link key={key} href={"/"+key} className="hub-button">{t(key)}</Link>)}</div></div>;}
