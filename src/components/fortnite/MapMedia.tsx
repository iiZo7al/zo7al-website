"use client";
import { useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import type { FortniteMap } from "@/lib/data/fortnite";

export default function MapMedia({ map, active }: { map: FortniteMap; active: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const media = video.current, url = map.videoUrl;
    if (!media || !url || !active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false, hls: Hls | undefined;
    const play = () => { if (!cancelled) void media.play().catch(() => { /* Keep the poster on playback failure. */ }); };
    const start = async () => {
      if (/\.m3u8(?:[?#]|$)/i.test(url)) {
        const { default: HlsPlayer } = await import("hls.js");
        if (cancelled) return;
        if (HlsPlayer.isSupported()) {
          hls = new HlsPlayer({ maxBufferLength: 10 });
          hls.on(HlsPlayer.Events.MANIFEST_PARSED, play);
          hls.on(HlsPlayer.Events.ERROR, (_, data) => { if (data.fatal) { setPlaying(false); hls?.destroy(); } });
          hls.loadSource(url); hls.attachMedia(media); return;
        }
        if (!media.canPlayType("application/vnd.apple.mpegurl")) return;
      }
      media.src = url; play();
    };
    void start().catch(() => { /* Lazy player loading can fail offline. */ });
    const onVisibility = () => { if (document.hidden) media.pause(); else play(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisibility); hls?.destroy(); media.pause(); media.removeAttribute("src"); media.load(); };
  }, [active, map.videoUrl]);
  return <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={map.thumbnail} alt={map.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]" />
    {map.videoUrl && active && <video ref={video} muted loop playsInline preload="none" aria-hidden="true" onLoadStart={() => setPlaying(false)} onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setPlaying(false)} className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity ${playing ? "opacity-100" : "opacity-0"}`} />}
  </>;
}
