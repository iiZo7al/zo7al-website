"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          data-cursor="button"
          aria-label="Back to top"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 end-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg"
          style={{
            background: "rgba(11,13,18,0.85)",
            borderColor: "var(--border-strong)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 24px var(--glow)",
          }}
        >
          <ArrowUp size={18} strokeWidth={2.5} style={{ color: "var(--accent)" }} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
