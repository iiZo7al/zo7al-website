"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId: number | null = null;
    let isAnimating = false;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const step = () => {
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.5) {
        window.scrollTo(0, targetY);
        currentY = targetY;
        isAnimating = false;
        rafId = null;
        return;
      }
      currentY += diff * 0.14;
      window.scrollTo(0, currentY);
      rafId = window.requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      if (document.body.style.overflow === "hidden") return;
      if (document.querySelector("dialog[open]")) return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (isScrollableContainer(target, event.deltaY)) return;

      event.preventDefault();

      if (!isAnimating) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }

      const multiplier =
        event.deltaMode === 1 ? 36 : event.deltaMode === 2 ? window.innerHeight : 1;
      targetY = Math.max(0, Math.min(maxScroll(), targetY + event.deltaY * multiplier));

      if (!isAnimating) {
        isAnimating = true;
        rafId = window.requestAnimationFrame(step);
      }
    };

    const onScroll = () => {
      if (!isAnimating) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    // Reset scroll position smoothly on route change unless hash is present
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname]);

  return null;
}
