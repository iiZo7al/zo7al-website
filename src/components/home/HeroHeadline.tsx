"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./hero.css";

const WORDS = [
  { text: "Network", color: "var(--accent)" },
  { text: "Games", color: "var(--accent-secondary)" },
  { text: "Maps", color: "var(--purple)" },
  { text: "Modpacks", color: "var(--green)" },
  { text: "Projects", color: "var(--accent)" },
] as const;
const FINAL = WORDS[WORDS.length - 1];

export default function HeroHeadline() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [frame, setFrame] = useState<{ text: string; color: string; complete: boolean }>({ text: WORDS[0].text, color: WORDS[0].color, complete: false });

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout>, index = 0, length = WORDS[0].text.length, deleting = true;
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

  useEffect(() => {
    if (!frame.complete) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!desktop.matches) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) return;

      if (event.key === "Backspace") {
        event.preventDefault();
        setInput((value) => value.slice(0, -1));
        return;
      }
      if (event.key === "Escape") {
        setInput("");
        return;
      }
      if (event.key === "Enter") {
        const word = input.toLowerCase();
        if (word === "maps") router.push("/fortnite");
        else if (word === "network") router.push("/minecraft");
        else setInput("");
        return;
      }
      if (/^[a-z]$/i.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setInput((value) => value.length < 8 ? value + event.key : value);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [frame.complete, input, router]);

  return <>
    <span className="sr-only">Zo7al Projects</span>
    <span className="hero-brand" dir="ltr" aria-hidden="true">
      <span>ZO7AL</span>
      <span className="hero-typewriter" style={{ color: frame.complete ? WORDS.find((word) => word.text.toLowerCase() === input.toLowerCase())?.color ?? "var(--accent)" : frame.color }}>
        <span className="hero-typewriter-reserve">Modpacks<span className="hero-typewriter-caret" /></span>
        <span className="hero-typewriter-line"><span className="hero-typewriter-word">{(frame.complete ? input || FINAL.text : frame.text).toUpperCase()}</span><span className={"hero-typewriter-caret" + (frame.complete && !input ? " is-complete" : "")} /></span>
      </span>
    </span>
  </>;
}
