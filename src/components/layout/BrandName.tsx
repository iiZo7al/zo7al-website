"use client";

import { useRef } from "react";
import { discoverEasterEgg } from "@/lib/data/easter-eggs";

export default function BrandName({
  name,
  footerTrigger = false,
}: {
  name: string;
  footerTrigger?: boolean;
}) {
  const clicksRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!footerTrigger) return <>{name}</>;

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => {
        clicksRef.current += 1;
        if (timerRef.current) clearTimeout(timerRef.current);
        if (clicksRef.current >= 5) {
          clicksRef.current = 0;
          discoverEasterEgg("footer_relic");
          return;
        }
        timerRef.current = setTimeout(() => {
          clicksRef.current = 0;
        }, 2500);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          clicksRef.current += 1;
          if (clicksRef.current >= 5) {
            clicksRef.current = 0;
            discoverEasterEgg("footer_relic");
          }
        }
      }}
      className="cursor-pointer select-none"
    >
      {name}
    </span>
  );
}
