"use client";

import { useEffect, useRef } from "react";

export default function HeroBackground() {
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      target.x = nx;
      target.y = ny;
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;
      if (bgRef.current)
        bgRef.current.style.transform = `translate3d(${current.x * 8}px, ${current.y * 6}px, 0)`;
      if (midRef.current)
        midRef.current.style.transform = `translate3d(${current.x * -16}px, ${current.y * -10}px, 0)`;
      if (fgRef.current)
        fgRef.current.style.transform = `translate3d(${current.x * 26}px, ${current.y * 16}px, 0) rotate(${current.x * 1.2}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* deep atmosphere */}
      <div
        ref={bgRef}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 18%, rgba(255,122,0,0.16) 0%, transparent 60%), radial-gradient(45% 40% at 82% 62%, rgba(25,217,255,0.12) 0%, transparent 65%), var(--bg)",
        }}
      />

      {/* orbital ring system, mid layer */}
      <div ref={midRef} className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 900 900"
          className="w-[130vw] max-w-none opacity-60 md:w-[70vw]"
          aria-hidden="true"
        >
          <ellipse
            cx="450"
            cy="450"
            rx="380"
            ry="120"
            fill="none"
            stroke="var(--accent-secondary)"
            strokeOpacity="0.25"
            strokeWidth="1"
            transform="rotate(-18 450 450)"
          />
          <ellipse
            cx="450"
            cy="450"
            rx="300"
            ry="92"
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.22"
            strokeWidth="1"
            transform="rotate(-18 450 450)"
          />
          <circle cx="450" cy="450" r="96" fill="url(#core)" />
          <defs>
            <radialGradient id="core" cx="35%" cy="35%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* grid horizon, foreground */}
      <div
        ref={fgRef}
        className="absolute inset-x-0 bottom-0 h-[45%]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          transform: "perspective(600px) rotateX(58deg)",
          transformOrigin: "bottom",
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{ background: "linear-gradient(to top, var(--bg), transparent)" }}
      />
    </div>
  );
}
