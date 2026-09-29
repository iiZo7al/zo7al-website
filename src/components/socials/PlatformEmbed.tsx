"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
/** Use provider-owned public embed scripts, with markup built from validated account paths. */
export default function PlatformEmbed({ platform, url }: { platform: string; url: string }) {
  const t = useTranslations("socials");
  const page = new URL(url), path = page.pathname.split("/").filter(Boolean);
  let markup = "";
  if (platform === "x" && path.length === 1 && /^\w+$/.test(path[0])) {
    markup = `<a class="twitter-timeline" data-theme="dark" data-dnt="true" data-chrome="noheader nofooter noborders transparent" data-tweet-limit="1" href="https://twitter.com/${escape(path[0])}">${escape(t("openProfile", { platform: "X" }))}</a><script async src="https://platform.twitter.com/widgets.js"></script>`;
  } else if (platform === "instagram" && path.length === 1 && /^[\w.]+$/.test(path[0])) {
    markup = `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/${escape(path[0])}/" data-instgrm-version="14" style="margin:0;width:100%;min-width:0"><a href="${escape(url)}" target="_blank">${escape(t("openProfile", { platform: "Instagram" }))}</a></blockquote><script async src="https://www.instagram.com/embed.js"></script>`;
  } else if (platform === "tiktok" && /^@[\w.]+$/.test(path[0] ?? "")) {
    markup = `<blockquote class="tiktok-embed" cite="${escape(url)}" data-unique-id="${escape(path[0].slice(1))}" data-embed-type="creator" data-embed-from="oembed" style="margin:0;max-width:100%;min-width:0"><section><a href="${escape(url)}" target="_blank">${escape(path[0])}</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`;
  } else if (platform === "snapchat" && ["add", "@"].includes(path[0]) && /^[\w.-]+$/.test(path[1] ?? "")) {
    markup = `<blockquote class="snapchat-embed" data-snapchat-embed-url="https://www.snapchat.com/add/${escape(path[1])}/embed" data-snapchat-embed-width="100%" data-snapchat-embed-height="480" style="margin:0;width:100%"><a href="${escape(url)}" target="_blank">${escape(t("openProfile", { platform: "Snapchat" }))}</a></blockquote><script async src="https://www.snapchat.com/embed.js"></script>`;
  }
  return markup ? <EmbedMarkup markup={markup} label={t("platformContent")} notice={t("embedNotice")} /> : null;
}

function EmbedMarkup({ markup, label, notice }: { markup: string; label: string; notice: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    // Only our own escaped template is inserted. Never execute provider-returned HTML.
    const scriptUrl = markup.match(/<script async src="([^"]+)"/)?.[1];
    element.innerHTML = markup.replace(/<script[\s\S]*?<\/script>/g, "");
    if (scriptUrl) {
      const script = document.createElement("script");
      script.src = scriptUrl; script.async = true;
      element.append(script);
    }
    return () => { element.replaceChildren(); };
  }, [markup]);
  return <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
    <div ref={host} aria-label={label} className="social-native-embed min-h-16 overflow-auto" />
    <p className="p-3 text-xs text-[var(--text-muted)]">{notice}</p>
  </div>;
}
