"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { Crown } from "lucide-react";
import type { SkinViewer } from "skinview3d";
import RankName from "./RankName";
import { rankGradient } from "@/lib/data/rank-style";
import { storeExperienceCopy } from "@/lib/data/store-experience-copy";
import "./store.css";

export default function CharacterPreview({ username, id, previewRank, profileServer, currentRank }: { username: string; id: string; previewRank?: string; profileServer?: string; currentRank?: string | null }) {
  const copy = storeExperienceCopy(useLocale());
  const canvas = useRef<HTMLCanvasElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [rank, setRank] = useState<{ identity: string; value: string | null } | null>(null);
  const identity = username + ":" + (profileServer ?? "");
  useEffect(() => {
    const controller = new AbortController();
    let viewer: SkinViewer | undefined;
    let observer: ResizeObserver | undefined;
    let disposed = false;
    const timer = setTimeout(() => {
      if (!previewRank && currentRank === undefined) fetch(`/api/minecraft/profile?username=${encodeURIComponent(username)}${profileServer ? "&server=" + encodeURIComponent(profileServer) : ""}`, { signal: controller.signal })
        .then(response => response.ok ? response.json() : null)
        .then(data => { if (!disposed) setRank({ identity, value: typeof data?.rank === "string" ? data.rank : null }); })
        .catch(() => { /* Rank remains unknown when the server is unavailable. */ });
      void (async () => {
        try {
          const { SkinViewer } = await import("skinview3d");
          if (disposed || !canvas.current || !host.current) return;
          viewer = new SkinViewer({ canvas: canvas.current, width: Math.max(1, host.current.clientWidth), height: 300 });
          viewer.controls.enablePan = false;
          viewer.controls.minDistance = 35;
          viewer.controls.maxDistance = 100;
          viewer.autoRotate = false;
          viewer.playerObject.rotation.y = -0.35;
          observer = new ResizeObserver(entries => { if (!disposed) viewer?.setSize(Math.max(1, entries[0].contentRect.width), 300); });
          observer.observe(host.current);
          await viewer.loadSkin(`https://mc-heads.net/skin/${encodeURIComponent(username)}`);
          if (!disposed) setState("ready");
        } catch {
          if (!disposed) { setState("error"); viewer?.dispose(); observer?.disconnect(); }
        }
      })();
    }, 500);
    return () => { disposed = true; clearTimeout(timer); controller.abort(); observer?.disconnect(); viewer?.dispose(); };
  }, [username, previewRank, profileServer, currentRank, identity]);
  const rankName = previewRank?.trim();
  const activeRank = currentRank === undefined ? rank?.identity === identity ? rank.value : null : currentRank;
  const [rankStart, rankEnd] = rankGradient(activeRank ?? "");

  return <section id={id} className="store-character" aria-label={copy.viewCharacter}>
    {rankName && <div className="store-preview-nametag" dir="ltr"><strong><RankName name={rankName}/></strong><span aria-hidden="true"><RankName name={rankName} text="✦"/></span><span>{username}</span></div>}
    <div ref={host} className="store-character-stage">
      <canvas ref={canvas} aria-label={`${copy.viewCharacter}: ${username}`} style={{ visibility: state === "ready" ? "visible" : "hidden" }}/>
      {state !== "ready" && <p role="status">{state === "error" ? copy.skinError : copy.skinLoading}</p>}
    </div>
    {!rankName && <><strong className="store-character-name" dir="ltr">{username}</strong>
    <div className={"store-current-rank" + (activeRank ? "" : " is-unknown")} style={{ "--rank-start": rankStart, "--rank-end": rankEnd } as CSSProperties}>
      <span className="store-current-rank-icon" aria-hidden="true"><Crown size={24}/></span>
      <div><span className="store-current-rank-label">{copy.currentRank}</span><bdi>{activeRank ? <RankName name={activeRank}/> : copy.rankUnavailable}</bdi></div>
    </div></>}
    {rankName && <p className="store-character-hint">{copy.previewOnly}</p>}
    {state === "ready" && <p className="store-character-hint">{copy.rotateHint}</p>}
  </section>;
}
