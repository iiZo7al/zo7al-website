"use client";
import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import DetailsDialog from "@/components/ui/DetailsDialog";
import "./creator-ranks.css";

const platforms = ["youtube", "twitch", "tiktok"] as const;
type Platform = typeof platforms[number];
export default function CreatorRanks() {
  const t = useTranslations("creators");
  const [selected, setSelected] = useState<Platform | null>(null);
  const reduce = useReducedMotion();
  return <section className="mb-14" aria-labelledby="creator-ranks-title">
    <div className="mb-5 flex items-center gap-4"><Image src="/assets/site/creator-category.webp" alt="" width={140} height={80} className="h-20 w-36 object-contain"/><h2 id="creator-ranks-title" className="text-display text-3xl">{t("title")}</h2></div>
    <p className="mb-6 mt-3 text-[var(--text-secondary)]">{t("intro")}</p>
    <div className="creator-rank-grid">{platforms.map((platform, index) => <motion.article key={platform} className={`card-glow store-rank creator-${platform}`} initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, delay: index * .08 }}>
      <Image src={`/assets/site/rank-${platform}.png`} width={667} height={375} alt={platform.toUpperCase()} className="creator-rank-image" />
      <p className="text-label">{t("title")}</p><h3 className="text-display store-rank-name" dir="ltr">{platform.toUpperCase()}</h3>
      <ul className="store-rank-perks"><li><Check size={15}/><span>{t("review")}</span></li><li><Check size={15}/><span>{t("noPayment")}</span></li></ul>
      <button className="store-action mt-auto" aria-haspopup="dialog" onClick={() => setSelected(platform)}><span>{t("apply")}</span><ArrowRight size={16}/></button>
    </motion.article>)}</div>
    {selected && <ApplicationForm platform={selected} onClose={() => setSelected(null)}/>}
  </section>;
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
