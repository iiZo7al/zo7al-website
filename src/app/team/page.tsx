import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { ArrowDown, ArrowUpRight, ArrowUp } from "lucide-react";
import BrandIcon from "@/components/ui/BrandIcon";
import { getTeamCopy } from "@/lib/data/team-copy";
import "./team.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { copy } = getTeamCopy(locale);
  return {
    title: copy.menuTeam,
    description: copy.aboutText,
  };
}

const roleIcons = ["youtube", "instagram", "tiktok", "x", "youtube", "threads", "fortnite"];

const socials = [
  { name: "Bluesky", handle: "@solarsystemteam.bsky.social", url: "https://bsky.app/profile/solarsystemteam.bsky.social", icon: "bluesky" },
  { name: "Threads", handle: "@solarsystemteam", url: "https://www.threads.com/@solarsystemteam", icon: "threads" },
  { name: "TikTok", handle: "@solarsystamteam", url: "https://www.tiktok.com/@solarsystamteam", icon: "tiktok" },
  { name: "Instagram", handle: "@solarsystemteam", url: "https://www.instagram.com/solarsystemteam/", icon: "instagram" },
  { name: "YouTube", handle: "@SolarSystemTeam", url: "https://www.youtube.com/@SolarSystemTeam", icon: "youtube" },
  { name: "X Community", handle: "Solar System", url: "https://x.com/i/communities/1996307060128940387", icon: "x" },
  { name: "X", handle: "@SolarSystemTeam", url: "https://x.com/SolarSystemTeam", icon: "x" },
];

export default async function TeamPage() {
  const locale = await getLocale();
  const arabic = locale === "ar";
  const { copy, roles } = getTeamCopy(locale);

  return (
    <main className="solar-page" data-accent="solar" dir={arabic ? "rtl" : "ltr"}>
      <section className="solar-hero">
        <div className="solar-hero-stars" aria-hidden="true" />
        <div className="solar-hero-inner">
          <div className="solar-hero-copy">
            <p className="text-label solar-eyebrow">{copy.eyebrow}</p>
            <h1 className="text-display">{copy.menuTeam}</h1>
            <p className="solar-intro">{copy.intro}</p>
            <div className="solar-hero-actions">
              <a className="solar-button solar-button-primary" href="#roles">{copy.rolesTitle}<ArrowDown size={16}/></a>
              <a className="solar-button solar-button-quiet" href="#socials">{copy.back}<ArrowUpRight size={16}/></a>
            </div>
            <div className="solar-orbit-label"><span /> {copy.eyebrow}</div>
          </div>
          <div className="solar-logo-wrap" aria-label="Solar System logo">
            <div className="solar-logo-aura" />
            <Image src="/assets/team/solar-system.png" alt="Solar System" width={520} height={520} priority className="solar-logo" />
            <span className="solar-logo-ring" aria-hidden="true" />
          </div>
        </div>
        <div className="solar-hero-index" aria-hidden="true">SS<span> / 01</span></div>
      </section>

      <section className="solar-section solar-about" aria-labelledby="solar-about-title">
        <div className="solar-section-kicker"><span>01</span><span>{copy.about}</span></div>
        <div className="solar-about-copy"><p className="text-label">SOLAR SYSTEM</p><h2 id="solar-about-title">{copy.about}</h2><p>{copy.aboutText}</p></div>
        <div className="solar-about-mark" aria-hidden="true">SS</div>
      </section>

      <section className="solar-section solar-roles-section" id="roles" aria-labelledby="solar-roles-title">
        <div className="solar-section-heading"><div><p className="text-label">{copy.rolesEyebrow}</p><h2 id="solar-roles-title">{copy.rolesTitle}</h2></div><p>{copy.rolesText}</p></div>
        <div className="solar-roles-grid">{roles.map((role, index) => <article className="solar-role-card" key={role}>
          <span className="solar-role-number">0{index + 1}</span><span className="solar-role-icon"><BrandIcon slug={roleIcons[index]} size={20}/></span><h3>{role}</h3><span className="solar-role-star" aria-hidden="true">✦</span>
        </article>)}</div>
      </section>

      <section className="solar-esports" id="esports" aria-labelledby="solar-esports-title">
        <div className="solar-esports-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div className="solar-esports-copy"><p className="text-label">02 · {copy.esportsEyebrow}</p><h2 id="solar-esports-title">{copy.esports}</h2><p>{copy.esportsText}</p><Link className="solar-button solar-button-primary" href="/support">{copy.join}<ArrowUpRight size={16}/></Link></div>
        <span className="solar-esports-watermark" aria-hidden="true">ES</span>
      </section>

      <section className="solar-section solar-faq-section" aria-labelledby="solar-faq-title">
        <div className="solar-section-heading"><div><p className="text-label">{copy.faqEyebrow}</p><h2 id="solar-faq-title">{copy.faqTitle}</h2></div><Link className="solar-text-link" href="/support">{copy.faqLink}<ArrowUpRight size={15}/></Link></div>
        <div className="solar-faq-list">
          {[[copy.question, copy.answer], [copy.joinQuestion, copy.joinAnswer], [copy.rolesQuestion, copy.rolesAnswer]].map(([question, answer], index) => <details className="solar-faq-item" key={question} open={index === 0}>
            <summary><span className="solar-faq-index">0{index + 1}</span><span>{question}</span><span className="solar-faq-plus" aria-hidden="true">+</span></summary><p>{answer}</p>
          </details>)}
        </div>
        <Link className="solar-more-button" href="/support">{copy.more}<ArrowUpRight size={16}/></Link>
      </section>

      <section className="solar-section solar-social-section" id="socials" aria-labelledby="solar-social-title">
        <div className="solar-section-heading"><div><p className="text-label">{copy.socialsEyebrow}</p><h2 id="solar-social-title">{copy.socialsTitle}</h2></div><p>{copy.socialsText}</p></div>
        <div className="solar-social-grid">{socials.map((social, index) => <a className="solar-social-card" key={`${social.name}-${index}`} href={social.url} target="_blank" rel="noopener noreferrer">
          <span className="solar-social-icon"><BrandIcon slug={social.icon} size={20}/></span><span className="solar-social-copy"><strong>{social.name}</strong><small dir="auto">{social.handle}</small></span><ArrowUp size={15} className="solar-social-arrow" aria-hidden="true"/>
        </a>)}</div>
      </section>

      <section className="solar-contact" aria-labelledby="solar-contact-title"><div><p className="text-label">SOLAR SYSTEM · SUPPORT</p><h2 id="solar-contact-title">{copy.support}</h2><p>{copy.supportText}</p></div><Link className="solar-button solar-button-primary" href="/support">{copy.supportCta}<ArrowUpRight size={16}/></Link></section>
    </main>
  );
}
