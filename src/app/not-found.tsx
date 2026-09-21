import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Home, Rocket } from "lucide-react";
export default async function NotFound() {
  const t = await getTranslations("lost");
  return <main data-accent="home" className="lost-page relative isolate min-h-svh overflow-hidden bg-[#07080b]">
    <Image src="/assets/site/lost-saturn.webp" alt="" fill unoptimized priority sizes="100vw" className="object-cover object-[64%_center] md:object-center" />
    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/40 md:via-transparent" />
    <div className="relative mx-auto max-w-[1440px] px-7 pb-[65vh] pt-20 md:pb-32 md:pt-[22vh]" dir="ltr">
      <div className="max-w-[410px] text-start" dir={t("direction")}>
        <p className="text-xs font-bold tracking-[0.3em] text-orange-500">{t("eyebrow")}</p>
        <h1 aria-label="404" dir="ltr" className="mt-4 flex items-center text-[7rem] font-black leading-none tracking-tighter sm:text-[9rem]">4<span className="relative text-orange-500">0<span aria-hidden="true" className="absolute inset-x-[-12%] top-[45%] h-[22%] -rotate-[35deg] rounded-[50%] border-[7px] border-orange-500 bg-transparent" /></span>4</h1>
        <h2 className="mt-4 text-2xl font-extrabold uppercase">{t("title")}</h2><p className="mt-4 leading-relaxed text-zinc-400">{t("text")}</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link href="/" data-cursor="button" className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-black"><Home size={16} />{t("home")}</Link><Link href="/#universe" data-cursor="link" className="flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-6 py-3 text-sm font-semibold"><Rocket size={16} />{t("explore")}</Link></div>
      </div>
    </div>
  </main>;
}
