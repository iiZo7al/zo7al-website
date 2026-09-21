import Image from "next/image";
import type { ReactNode } from "react";
export default function ServerHero({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: ReactNode }) {
  return <section className="relative overflow-hidden pb-16 pt-36 sm:pb-24 sm:pt-44">
    <div aria-hidden="true" className="pointer-events-none absolute -end-20 top-8 h-[540px] w-[540px] rounded-full bg-orange-500/15 blur-[100px]" />
    <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-6 md:grid-cols-[1.2fr_1fr]">
      <div><p className="text-label text-[var(--accent)]">{eyebrow}</p><h1 className="mt-5 text-5xl font-black tracking-tight sm:text-7xl">{title}</h1><p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]">{text}</p><div className="mt-8 flex flex-wrap gap-3">{children}</div></div>
      <div className="relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center md:max-w-[390px]">
        <div aria-hidden="true" className="absolute inset-4 rotate-12 rounded-[3rem] border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent" />
        <div aria-hidden="true" className="absolute inset-10 -rotate-6 rounded-[3rem] border border-white/10" />
        <Image src="/assets/site/server-logo.png" alt="Zo7al Network" width={200} height={200} priority className="relative h-auto w-4/5 drop-shadow-[0_20px_45px_rgba(255,122,0,0.25)]" />
      </div>
    </div>
  </section>;
}
