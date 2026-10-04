"use client";
import { useTranslations } from "next-intl";
export default function InstallationGuide({source,url}:{source:"Modrinth"|"CurseForge";url:string}) {
  const t=useTranslations("hub");
  return <section className="hub-install"><h3 className="mb-3 font-semibold">{t("installation")}</h3><ol>{(["installLauncher","installProject","installVersion","installLaunch"] as const).map(key=><li key={key}>{t(key,{source})}</li>)}</ol><div className="hub-actions"><a className="hub-button" href={source==="Modrinth"?"https://modrinth.com/app":"https://www.curseforge.com/download/app"} target="_blank" rel="noopener noreferrer">{t("launcher",{source})}</a><a className="hub-button" href={url} target="_blank" rel="noopener noreferrer">{t("projectPage")}</a></div></section>;
}
