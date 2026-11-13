"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SCROLL_KEYS = new Set([
  " ",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "ArrowUp",
  "ArrowDown",
]);

function isScrollableContainer(node: HTMLElement | null, deltaY: number): boolean {
  let el: HTMLElement | null = node;
  while (el && el !== document.body && el !== document.documentElement) {
    const tag = el.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable
    ) {
      return true;
    }
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 2
    ) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const root = document.documentElement;
    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId: number | null = null;
    let isAnimating = false;
    let lastTime = 0;

    const maxScroll = () =>
      Math.max(0, root.scrollHeight - window.innerHeight);

    const stopAnimation = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (isAnimating) {
        isAnimating = false;
        root.style.scrollBehavior = "";
      }
      currentY = window.scrollY;
      targetY = window.scrollY;
    };

    const step = (now: number) => {
      const dt = lastTime ? Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000)) : 1 / 60;
      lastTime = now;

      const limit = maxScroll();
      if (targetY > limit) targetY = limit;
      if (targetY < 0) targetY = 0;

      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.5) {
        window.scrollTo({ top: targetY, behavior: "instant" });
        currentY = targetY;
        isAnimating = false;
        rafId = null;
        lastTime = 0;
        root.style.scrollBehavior = "";
        return;
      }

      const factor = 1 - Math.exp(-12 * dt);
      currentY += diff * factor;
      window.scrollTo({ top: currentY, behavior: "instant" });
      rafId = window.requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (event.deltaY === 0) return;
      if (document.body.style.overflow === "hidden") return;
      if (document.querySelector("dialog[open]")) return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (isScrollableContainer(target, event.deltaY)) return;

      event.preventDefault();

      if (!isAnimating) {
        currentY = window.scrollY;
        targetY = window.scrollY;
        root.style.scrollBehavior = "auto";
        lastTime = performance.now();
        isAnimating = true;
        rafId = window.requestAnimationFrame(step);
      }

      const multiplier =
        event.deltaMode === 1 ? 36 : event.deltaMode === 2 ? window.innerHeight : 1;
      targetY = Math.max(0, Math.min(maxScroll(), targetY + event.deltaY * multiplier));
    };

    const onScroll = () => {
      if (!isAnimating) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) {
        stopAnimation();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", stopAnimation, { passive: true });
    window.addEventListener("pointerdown", stopAnimation, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", stopAnimation);
      window.removeEventListener("pointerdown", stopAnimation);
      window.removeEventListener("keydown", onKeyDown);
      stopAnimation();
    };
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);

  return null;
}
