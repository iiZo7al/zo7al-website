"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type CursorMode = "default" | "link" | "button" | "project" | "image" | "copy";

const RING_SIZE: Record<CursorMode, number> = {
  default: 34,
  link: 44,
  button: 64,
  project: 96,
  image: 76,
  copy: 64,
};


/**
 * Renders the floating dot / ring / glow, driven by a rAF loop with simple
 * lerp-based inertia. Reads hover intent from `data-cursor` (and optional
 * `data-cursor-label`) attributes on any ancestor element, via delegated
 * mouseover/mouseout — so individual components never need to import this.
 *
 * Disabled entirely on coarse (touch) pointers and short-circuited under
 * prefers-reduced-motion.
 */
export default function CustomCursor() {
  const t = useTranslations("ui"), tc = useTranslations("common");
  const layerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const [mode, setMode] = useState<CursorMode>("default");
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse) return;
    document.documentElement.classList.add("cursor-ready");
    const layer = layerRef.current;
    let lastDialog: Element | null = null;
    const raiseLayer = () => {
      if (!layer?.showPopover) return;
      try {
        if (layer.matches(":popover-open")) layer.hidePopover();
        layer.showPopover();
        document.documentElement.classList.toggle("cursor-top-layer", layer.matches(":popover-open"));
      } catch {
        document.documentElement.classList.remove("cursor-top-layer");
        layer.removeAttribute("popover");
      }
    };
    if (layer?.showPopover) raiseLayer();
    else layer?.removeAttribute("popover");
    const observer = new MutationObserver(() => {
      const dialogs = document.querySelectorAll("dialog[open]");
      const topDialog = dialogs.item(dialogs.length - 1);
      if (topDialog !== lastDialog) { lastDialog = topDialog; raiseLayer(); refreshHover(document.elementFromPoint(mouse.x, mouse.y)); }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["open"], childList: true, subtree: true });

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y };
    const glow = { x: mouse.x, y: mouse.y };
    let raf = 0;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.("iframe")) { visible = false; document.documentElement.classList.remove("cursor-visible"); return; }
      document.documentElement.classList.add("cursor-visible");
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      refreshHover(e.target instanceof Element ? e.target : null);
      if (!visible) {
        visible = true;
        ring.x = mouse.x;
        ring.y = mouse.y;
        glow.x = mouse.x;
        glow.y = mouse.y;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
    };

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    const tick = () => {
      if (reduced) {
        ring.x = mouse.x;
        ring.y = mouse.y;
        glow.x = mouse.x;
        glow.y = mouse.y;
      } else {
        ring.x = lerp(ring.x, mouse.x, 0.22);
        ring.y = lerp(ring.y, mouse.y, 0.22);
        glow.x = lerp(glow.x, mouse.x, 0.1);
        glow.y = lerp(glow.y, mouse.y, 0.1);
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(var(--press, 1))`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const resolveMode = (el: Element | null): { mode: CursorMode; label?: string } | null => {
      // Resolve the closest control before a containing card's custom cursor.
      const target = el?.closest('[data-cursor], button, a[href], [role="button"], summary, select, input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], input[type="range"]');
      if (!target || target.matches(':disabled, [aria-disabled="true"]') || target.closest('[inert]')) return null;
      const explicit = target.getAttribute("data-cursor");
      const mode: CursorMode = explicit && Object.hasOwn(RING_SIZE, explicit)
        ? explicit as CursorMode : target.matches('a[href]') ? "link" : "button";
      const label = target.getAttribute("data-cursor-label") ?? (explicit ? undefined : "");
      return { mode, label };
    };
    function refreshHover(target: Element | null) {
      const resolved = resolveMode(target);
      setMode(resolved?.mode ?? "default");
      setHoverLabel(resolved?.label ?? null);
    }
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element)?.closest("iframe")) { visible = false; document.documentElement.classList.remove("cursor-visible"); }
      refreshHover(e.target instanceof Element ? e.target : null);
    };
    const hide = () => {
      visible = false;
      document.documentElement.classList.remove("cursor-visible");
      ringRef.current?.style.removeProperty("--press");
      refreshHover(null);
    };
    const onVisibility = () => { if (document.hidden) hide(); };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
      refreshHover(e.relatedTarget instanceof Element ? e.relatedTarget : null);
    };

    const onDown = () => ringRef.current?.style.setProperty("--press", "0.85");
    const onUp = () => ringRef.current?.style.removeProperty("--press");

    const onFlash = (e: Event) => {
      const detail = (e as CustomEvent<{ label: string; duration?: number }>).detail;
      if (!detail) return;
      setFlash(detail.label);
      window.setTimeout(() => setFlash(null), detail.duration ?? 1100);
    };

    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    window.addEventListener("zo7al:cursor-flash", onFlash);

    return () => {
      observer.disconnect();
      if (layer?.hidePopover && layer.matches(":popover-open")) layer.hidePopover();
      document.documentElement.classList.remove("cursor-top-layer");
      cancelAnimationFrame(raf);
      hide();
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      window.removeEventListener("zo7al:cursor-flash", onFlash);
      document.documentElement.classList.remove("cursor-ready");
    };
  }, []);

  const size = RING_SIZE[mode];
  const label = flash ?? hoverLabel ?? (mode === "project" ? t("explore") : mode === "copy" ? tc("copy") : mode === "button" || mode === "image" ? t("view") : "");
  const active = mode !== "default" || !!flash;

  return (
    <div ref={layerRef} popover="manual" className="cursor-layer" aria-hidden="true">
      <div ref={glowRef} className="cursor-glow" style={{ opacity: active ? 0.7 : 0.35 }} />
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{
          width: size,
          height: size,
          borderColor: active ? "var(--accent)" : "rgba(255,255,255,0.45)",
          background: active ? "rgba(255,255,255,0.04)" : "transparent",
          boxShadow: active ? "0 0 24px var(--glow)" : "none",
        }}
      >
        <span ref={labelRef} style={{ opacity: label ? 1 : 0 }}>
          {label}
        </span>
      </div>
      <div ref={dotRef} className="cursor-dot" style={{ opacity: active ? 0 : 1 }} />
    </div>
  );
}

/** Fire a temporary label override on the cursor (e.g. "COPIED" after a click). */
export function flashCursor(label: string, duration = 1100) {
  window.dispatchEvent(new CustomEvent("zo7al:cursor-flash", { detail: { label, duration } }));
}

