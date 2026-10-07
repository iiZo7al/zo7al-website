"use client";

import { useEffect, useState } from "react";
import "./hero.css";

const WORDS = [
  { text: "Games", color: "var(--accent-secondary)" },
  { text: "Network", color: "var(--accent)" },
  { text: "Maps", color: "var(--purple)" },
  { text: "Modpacks", color: "var(--green)" },
  { text: "Projects", color: "var(--accent)" },
] as const;
const FINAL = WORDS[WORDS.length - 1];

export default function HeroHeadline() {
  const [frame, setFrame] = useState<{ text: string; color: string; complete: boolean }>({ text: "", color: WORDS[0].color, complete: false });

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout>, index = 0, length = 0, deleting = false;
    const finish = () => { clearTimeout(timer); setFrame({ ...FINAL, complete: true }); };
    const step = () => {
      const word = WORDS[index];
      length += deleting ? -1 : 1;
      const complete = index === WORDS.length - 1 && length === word.text.length;
      setFrame({ text: word.text.slice(0, length), color: word.color, complete });
      if (complete) return;
      let delay = deleting ? 45 : 90;
      if (!deleting && length === word.text.length) { deleting = true; delay = 1050; }
      else if (deleting && length === 0) { deleting = false; index++; delay = 240; }
      timer = setTimeout(step, delay);
    };
    const changed = () => { if (preference.matches) finish(); };
    timer = setTimeout(preference.matches ? finish : step, preference.matches ? 0 : 650);
    preference.addEventListener("change", changed);
    return () => { clearTimeout(timer); preference.removeEventListener("change", changed); };
  }, []);

  return <>
    <span className="sr-only">Zo7al Projects</span>
    <span className="hero-brand" dir="ltr" aria-hidden="true">
      <span>Zo7al</span>
      <span className="hero-typewriter" style={{ color: frame.color }}>
        <span className="hero-typewriter-reserve">Modpacks<span className="hero-typewriter-caret" /></span>
        <span className="hero-typewriter-line"><span className="hero-typewriter-word">{frame.text}</span><span className={"hero-typewriter-caret" + (frame.complete ? " is-complete" : "")} /></span>
      </span>
    </span>
  </>;
}
