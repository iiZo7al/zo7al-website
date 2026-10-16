"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowDown, Music2 } from "lucide-react";

export type MikuChapter = {
  title: string;
  scene: string;
  caption: string;
  zo7al: string;
  miku: string;
};

export default function MikuManga({
  intro,
  scrollHint,
  pageLabel,
  endingTitle,
  endingText,
  pages,
}: {
  intro: string;
  scrollHint: string;
  pageLabel: string;
  endingTitle: string;
  endingText: string;
  pages: MikuChapter[];
}) {
  const bookRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { scrollYProgress } = useScroll({
    target: bookRef,
    offset: ["start 0.85", "end 0.55"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 28, mass: 0.25 });

  return (
    <div className="miku-story">
      <header className="miku-cover">
        <div className="miku-cover-orbit miku-cover-orbit-one" aria-hidden="true" />
        <div className="miku-cover-orbit miku-cover-orbit-two" aria-hidden="true" />
        <p className="miku-eyebrow">ZO7AL PROJECTS PRESENTS</p>
        <h1 className="miku-brand-title" dir="ltr">
          <span>Zo7al</span>
          <span className="miku-brand-amp">&amp;</span>
          <span className="miku-brand-name">Miku</span>
        </h1>
        <p className="miku-cover-intro">{intro}</p>
        <a href="#miku-story-pages" className="miku-scroll-cue" data-cursor="button">
          <span>{scrollHint}</span>
          <ArrowDown size={17} aria-hidden="true" />
        </a>
      </header>

      <div className="miku-reader-status" aria-live="polite">
        <span>{pageLabel} {String(currentPage + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</span>
        <div className="miku-progress-track" aria-hidden="true">
          <motion.span className="miku-progress-fill" style={{ scaleX: progress }} />
        </div>
        <Music2 size={17} aria-hidden="true" />
      </div>

      <div ref={bookRef} id="miku-story-pages" className="miku-book">
        {pages.map((page, index) => (
          <motion.article
            id={`miku-page-${index + 1}`}
            key={`${page.title}-${index}`}
            className="miku-book-leaf"
            onViewportEnter={() => setCurrentPage(index)}
            initial={{ opacity: 0, rotateY: 9, y: 36 }}
            whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
            viewport={{ once: false, amount: 0.32 }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformPerspective: 1400 }}
            aria-label={page.title}
          >
            <div className="miku-page-number" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span className="miku-page-number-line" />
            </div>
            <div className="miku-book-spread">
              <div className={`miku-art-panel miku-art-panel-${index % 6}`} aria-hidden="true">
                <div className="miku-art-halftone" />
                <div className="miku-art-scene">{page.scene}</div>
                <div className="miku-art-moon" />
                <div className="miku-art-light miku-art-light-one" />
                <div className="miku-art-light miku-art-light-two" />
                <div className="miku-cityline">
                  <span /><span /><span /><span /><span /><span />
                </div>
                <div className="miku-character miku-character-zo7al">
                  <span className="miku-character-head" />
                  <span className="miku-character-body" />
                </div>
                <div className="miku-character miku-character-miku">
                  <span className="miku-hair-tail miku-hair-tail-left" />
                  <span className="miku-hair-tail miku-hair-tail-right" />
                  <span className="miku-character-head" />
                  <span className="miku-character-body" />
                </div>
                <div className="miku-sound-lines"><i /><i /><i /></div>
                <span className="miku-art-stamp">ZO7AL <b>&amp;</b> MIKU</span>
              </div>

              <div className="miku-page-copy">
                <p className="miku-page-kicker">CHAPTER {String(index + 1).padStart(2, "0")}</p>
                <h2>{page.title}</h2>
                <p className="miku-page-caption">{page.caption}</p>
                <div className="miku-dialogue miku-dialogue-zo7al">
                  <span>Zo7al</span>
                  <p>{page.zo7al}</p>
                </div>
                <div className="miku-dialogue miku-dialogue-miku">
                  <span>Miku</span>
                  <p>{page.miku}</p>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <motion.section
        className="miku-ending"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7 }}
      >
        <Music2 size={25} aria-hidden="true" />
        <h2>{endingTitle}</h2>
        <p>{endingText}</p>
        <p className="miku-ending-signature" dir="ltr">
          <span>Zo7al</span> <b>&amp;</b> <span>Miku</span>
        </p>
      </motion.section>
    </div>
  );
}
