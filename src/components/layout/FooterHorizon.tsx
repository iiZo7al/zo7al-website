"use client";

import { useEffect, useState } from "react";

export default function FooterHorizon() {
  const [isRising, setIsRising] = useState(false);

  useEffect(() => {
    let previousWheelAt = 0;
    let revealed = false;

    const remainingToFooter = () =>
      document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    const footerRange = () => Math.max(520, window.innerHeight * 1.25);

    const onWheel = (event: WheelEvent) => {
      const now = performance.now();
      const fastDownwardScroll =
        event.deltaY >= 90 && (event.deltaY >= 150 || now - previousWheelAt < 110);
      previousWheelAt = now;

      if (event.deltaY < 0) {
        if (remainingToFooter() > footerRange()) {
          revealed = false;
          setIsRising(false);
        }
        return;
      }

      if (fastDownwardScroll && remainingToFooter() <= footerRange()) {
        revealed = true;
        setIsRising(true);
      }
    };

    const onScroll = () => {
      if (revealed && remainingToFooter() > Math.max(760, window.innerHeight * 1.6)) {
        revealed = false;
        setIsRising(false);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className={`site-footer-horizon${isRising ? " is-rising" : ""}`} aria-hidden="true">
      <div className="site-footer-horizon-image" />
    </div>
  );
}
