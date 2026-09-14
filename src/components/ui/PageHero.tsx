"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function PageHero({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-[calc(var(--nav-height)+64px)] pb-20 sm:pb-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-[100px]"
          style={{ background: "var(--glow)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[1180px] px-6">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-label"
          style={{ color: "var(--accent)" }}
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
          className="text-display mt-4 text-5xl sm:text-6xl md:text-7xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
          className="mt-6 max-w-xl text-lg text-[var(--text-muted)]"
        >
          {text}
        </motion.p>
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
            className="mt-9"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
