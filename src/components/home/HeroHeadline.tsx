"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/components/account/AccountProvider";
import { DISCORD_LINK } from "@/lib/data/site";
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
  const { account, canDashboard } = useAccount();
  const [input, setInput] = useState<string>(FINAL.text);
  const resetting = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animateReset = useCallback((startingValue: string) => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetting.current = true;
    let value = startingValue;
    const erase = () => {
      value = value.slice(0, -1);
      setInput(value);
      if (value.length) {
        resetTimer.current = setTimeout(erase, 45);
        return;
      }
      let position = 0;
      const type = () => {
        position += 1;
        value = FINAL.text.slice(0, position);
        setInput(value);
        if (position < FINAL.text.length) {
          resetTimer.current = setTimeout(type, 90);
        } else {
          resetting.current = false;
          resetTimer.current = null;
        }
      };
      resetTimer.current = setTimeout(type, 90);
    };
    erase();
  }, []);
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
    if (!frame.complete || input === FINAL.text || resetting.current) return;
    idleTimer.current = setTimeout(() => animateReset(input), 5000);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = null;
    };
  }, [animateReset, frame.complete, input]);

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  useEffect(() => {
    if (!frame.complete) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const cancelReset = () => {
      if (!resetting.current) return;
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = null;
      resetting.current = false;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!desktop.matches) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) return;

      if (event.key === "Backspace") {
        cancelReset();
        event.preventDefault();
        setInput((value) => value.slice(0, -1));
        return;
      }
      if (event.key === "Escape") {
        cancelReset();
        animateReset(input);
        return;
      }
      if (event.key === "Enter") {
        cancelReset();
        event.preventDefault();
        const word = input.trim().toLowerCase();
        const destinations: Record<string, string> = {
          home: "/",
          games: "/game",
          maps: "/fortnite",
          fortnite: "/fortnite",
          network: "/minecraft",
          minecraft: "/minecraft",
          modpacks: "/modpacks",
          support: "/support",
          store: "/store",
          shop: "/store",
          socials: "/socials",
          applications: "/applications",
          events: "/events",
          game: "/game",
          news: "/news",
          orders: "/orders",
          player: "/player",
          requests: "/requests",
          tracking: "/tracking",
        };
        if (word === "dashboard" && canDashboard) router.push("/dashboard");
        else if (word === "account" && account) router.push("/account");
        else if (word === "profile" && account) router.push("/account?tab=profile");
        else if (word === "settings" && account) router.push("/account?tab=settings");
        else if (word === "security" && account) router.push("/account?tab=security");
        else if (word === "subscriptions" && account) router.push("/account?tab=subscriptions");
        else if (word === "discord") {
          window.open(DISCORD_LINK, "_blank", "noopener,noreferrer");
          animateReset(input);
        } else if (destinations[word]) router.push(destinations[word]);
        else animateReset(input);
        return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        cancelReset();
        event.preventDefault();
        setInput((value) => value.length < 24 ? value + event.key : value);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [animateReset, frame.complete, input, router]);

  return <>
    <span className="sr-only">Zo7al Projects</span>
    <span className="hero-brand" dir="ltr" aria-hidden="true">
      <span>ZO7AL</span>
      <span className="hero-typewriter" style={{ color: frame.complete ? WORDS.find((word) => word.text.toLowerCase() === input.toLowerCase())?.color ?? "var(--accent)" : frame.color }}>
        <span className="hero-typewriter-reserve">Modpacks<span className="hero-typewriter-caret" /></span>
        <span className="hero-typewriter-line"><span className="hero-typewriter-word">
          {frame.complete && input.trim().toUpperCase() === "& MIKU" ? <>
            <span style={{ color: "#ff5ca8" }}>&amp;</span>{" "}
            <span style={{ color: "#62e7ff" }}>MIKU</span>
          </> : (frame.complete ? input : frame.text).toUpperCase()}
        </span><span className={"hero-typewriter-caret" + (frame.complete && !input ? " is-complete" : "")} /></span>
      </span>
    </span>
  </>;
}
