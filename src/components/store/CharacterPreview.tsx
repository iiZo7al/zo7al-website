"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { SkinViewer } from "skinview3d";
import { storeExperienceCopy } from "@/lib/data/store-experience-copy";

export default function CharacterPreview({ username, id }: { username: string; id: string }) {
  const copy = storeExperienceCopy(useLocale());
  const canvas = useRef<HTMLCanvasElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [rank, setRank] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let viewer: SkinViewer | undefined;
    let observer: ResizeObserver | undefined;
    let disposed = false;
    const timer = setTimeout(() => {
      fetch(`/api/minecraft/profile?username=${encodeURIComponent(username)}`, { signal: controller.signal })
        .then(response => response.ok ? response.json() : null)
        .then(data => { if (!disposed) setRank(typeof data?.rank === "string" ? data.rank : null); })
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
  }, [username]);
  return <section id={id} className="store-character" aria-label={copy.viewCharacter}>
    <div ref={host} className="store-character-stage">
      <canvas ref={canvas} aria-label={`${copy.viewCharacter}: ${username}`} style={{ visibility: state === "ready" ? "visible" : "hidden" }}/>
      {state !== "ready" && <p role="status">{state === "error" ? copy.skinError : copy.skinLoading}</p>}
    </div>
    <strong className="store-character-name" dir="ltr">{username}</strong>
    <p className="store-character-rank"><span>{copy.currentRank}</span><bdi>{rank ?? copy.rankUnavailable}</bdi></p>
    {state === "ready" && <p className="store-character-hint">{copy.rotateHint}</p>}
  </section>;
}
