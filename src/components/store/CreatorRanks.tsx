"use client";
import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import DetailsIcon from "@/components/ui/DetailsIcon";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { getCreatorRankContent } from "@/lib/data/creator-rank-content";
import "./creator-ranks.css";

const platforms = ["youtube", "twitch", "tiktok"] as const;
type Platform = typeof platforms[number];
export default function CreatorRanks() {
  const t = useTranslations("creators");
  const ui = useTranslations("store");
  const [details, setDetails] = useState<Platform | null>(null);
  const [selected, setSelected] = useState<Platform | null>(null);
  const reduce = useReducedMotion();
  const locale = useLocale();
  const detailContent = details ? getCreatorRankContent(locale, details) : null;
  return <section className="mb-14" aria-labelledby="creator-ranks-title">
    <div className="mb-5 flex items-center gap-4"><Image src="/assets/site/creator-category.webp" alt="" width={140} height={80} className="h-20 w-36 object-contain"/><h2 id="creator-ranks-title" className="text-display text-3xl">{t("title")}</h2></div>
    <div className="store-rank-grid creator-rank-grid">{platforms.map((platform, index) => <motion.div key={platform} className="store-rank-reveal" initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}>
      <article className={`card-glow store-rank creator-${platform}`}>
      <div className="store-rank-top"><Image src={`/assets/site/rank-${platform}.png`} width={667} height={375} alt={platform.toUpperCase()} className="store-product-image creator-rank-image" /></div>
      <p className="text-label">{t("title")}</p><h3 className="text-display store-rank-name" dir="ltr">{platform.toUpperCase()}</h3>
      <p className="store-rank-price">{getCreatorRankContent(locale, platform).free}</p>
      <ul className="store-rank-perks">{getCreatorRankContent(locale, platform).preview.map(perk => <li key={perk}><Check size={15} aria-hidden="true"/><span><CreatorText text={perk}/></span></li>)}</ul>
      <div className="store-rank-actions"><button type="button" className="store-action" data-cursor="button" aria-haspopup="dialog" onClick={() => setSelected(platform)}><span>{t("apply")}</span><ArrowRight size={16} className="store-direction" aria-hidden="true"/></button>
      <button type="button" className="store-action store-details-button" data-cursor="button" aria-haspopup="dialog" aria-label={`${ui("details")} — ${platform.toUpperCase()}`} title={ui("details")} onClick={() => setDetails(platform)}><DetailsIcon/></button></div>
      </article>
    </motion.div>)}</div>
    {details && <DetailsDialog title={`${ui("details")} · ${details.toUpperCase()}`} onClose={() => setDetails(null)}>
      <div className="store-checkout-body store-full-description">
        <Image src={`/assets/site/rank-${details}.png`} width={667} height={375} alt={details.toUpperCase()} className="store-details-image"/>
        {detailContent && <div className="creator-full-description">
          <h3>{detailContent.title}</h3>
          {detailContent.intro.map(paragraph => <p key={paragraph}><CreatorText text={paragraph}/></p>)}
          {detailContent.sections.map(section => <section key={section.title}>
            <h4>{section.title}</h4>
            <ul>{section.items.map(item => <li key={item}><Check size={16} aria-hidden="true"/><span><CreatorText text={item}/></span></li>)}</ul>
          </section>)}
          <dl>{detailContent.summary.map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}</dl>
        </div>}
        <button type="button" className="store-action store-action-primary" data-cursor="button" onClick={() => { setDetails(null); setSelected(details); }}><span>{t("apply")}</span><ArrowRight size={16} className="store-direction" aria-hidden="true"/></button>
      </div>
    </DetailsDialog>}
    {selected && <ApplicationForm platform={selected} onClose={() => setSelected(null)}/>}
  </section>;
}
function CreatorText({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) =>
    part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> :
    part.startsWith("`") ? <code dir="ltr" key={index}>{part.slice(1, -1)}</code> : part
  )}</>;
}
function ApplicationForm({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  const t = useTranslations("creators");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setStatus("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/creator-applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(data), platform, consent: data.get("consent") === "on" }) });
      const result = await response.json();
      if (response.ok && result.ok === true) { setReference(result.reference); setStatus("success"); }
      else setStatus(result.error === "RATE_LIMIT" ? "rateLimit" : result.error === "INVALID" ? "invalid" : result.error === "UNAVAILABLE" ? "unavailable" : "failed");
    } catch { setStatus("failed"); }
    finally { lock.current = false; setBusy(false); }
  }
  return <DetailsDialog title={`${t("apply")} · ${platform.toUpperCase()}`} onClose={onClose}>
    <div className="creator-form-body">
      <Image src={`/assets/site/rank-${platform}.png`} width={667} height={375} alt={platform.toUpperCase()} className="creator-modal-image"/>
      {status === "success" ? <div role="status" className="creator-success"><Check size={30}/><h3>{t("success")}</h3><p>{t("review")}</p><p>{t("reference")}: <bdi>{reference}</bdi></p></div> : <form onSubmit={submit} className="creator-form">
        <p>{t("intro")}</p>
        <div className="creator-fields">{([ ["email", "email", 254], ["minecraft", "text", 32], ["discord", "text", 40], ["channel", "url", 500], ["followers", "number", 10] ] as const).map(([name, type, max]) => <label key={name} htmlFor={`creator-${name}`}>{t(name)}<input id={`creator-${name}`} name={name} type={type} required maxLength={max} min={type === "number" ? 0 : undefined} max={type === "number" ? 1000000000 : undefined} step={type === "number" ? 1 : undefined} autoComplete={name === "email" ? "email" : "off"} dir="ltr" placeholder={name === "channel" ? { youtube: "https://www.youtube.com/@yourchannel", twitch: "https://www.twitch.tv/yourchannel", tiktok: "https://www.tiktok.com/@yourchannel" }[platform] : undefined}/></label>)}</div>
        <label htmlFor="creator-content">{t("content")}<input id="creator-content" name="content" required maxLength={500}/></label>
        <label htmlFor="creator-reason">{t("reason")}<textarea id="creator-reason" name="reason" required minLength={20} maxLength={1000} rows={4}/><small>{t("reasonHint")}</small></label>
        <div className="creator-honey" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
        <label className="creator-consent"><input name="consent" type="checkbox" required/><span>{t("consent")}</span></label>
        {status && <p role="alert" className="creator-error">{t(status)}</p>}
        <button className="store-action store-action-primary" type="submit" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={18}/>}<span>{t(busy ? "sending" : "submit")}</span></button>
      </form>}
    </div>
  </DetailsDialog>;
}
