"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import SpaceExperience from "./SpaceExperience";
import MagneticButton from "@/components/cursor/MagneticButton";

const EASE = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function Hero() {
  const t = useTranslations("home");
  const [gameActive, setGameActive] = useState(false);
  const onGameStateChange = useCallback((state: string) => setGameActive(state !== "SATURN"), []);

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center pt-[var(--nav-height)]">
      <SpaceExperience onGameStateChange={onGameStateChange} />

      <motion.div
        variants={container}
        initial="hidden"
        animate={gameActive ? { opacity: 0, y: -20 } : "show"}
        transition={{ duration: 0.5, ease: "easeIn" }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
        style={{ pointerEvents: "none" }}
        inert={gameActive}
      >
        <motion.p variants={item} className="text-label mb-6" style={{ color: "var(--accent)" }}>
          {t("eyebrow")}
        </motion.p>

        <motion.h1
          variants={item}
          className="text-display text-[16vw] sm:text-7xl md:text-8xl lg:text-[7.5rem]"
        >
          {t("headline1")}
          <br />
          {t("headline2")}
          <br />
          {t("headline3")}
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-8 max-w-xl text-balance text-lg text-[var(--text-muted)] sm:text-xl"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-4" style={{ pointerEvents: gameActive ? "none" : "auto" }}>
          <MagneticButton>
            <Link
              href="/minecraft"
              data-cursor="button"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform"
              style={{ background: "var(--accent)", color: "#07080B" }}
            >
              {t("ctaExplore")}
            </Link>
          </MagneticButton>
          <MagneticButton>
            <a
              href="#universe"
              data-cursor="link"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--border-strong)" }}
            >
              {t("ctaViewProjects")}
            </a>
          </MagneticButton>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: gameActive ? 0 : 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="pointer-events-none absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-[var(--text-muted)]"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-label">{t("scroll")}</span>
          <span
            className="home-scroll-arrow inline-flex text-[var(--accent)]"
            aria-hidden="true"
            style={{ animationPlayState: gameActive ? "paused" : "running" }}
          >
            <ArrowDown size={22} strokeWidth={1.8} />
          </span>
        </div>
      </motion.div>
    </section>
  );
}

