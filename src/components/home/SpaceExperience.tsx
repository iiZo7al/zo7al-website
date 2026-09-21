"use client";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { playerKey } from "./player-identity";
import { spaceApi } from "./space-api";

import { useState, Suspense, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { GAME_VERSION } from "./game-version";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { Stars, Environment, Lightformer, Html } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { isRtl } from "@/i18n/config";
import SaturnScene from "./SaturnScene";
import GameScene, { type FlightProgress } from "./GameScene";
import GameLeaderboard, { type RunTicket } from "./GameLeaderboard";
import GameControls from "./GameControls";
import { SpaceAudio, type SpaceSound } from "./space-audio";

type GameState = "SATURN" | "TRANSITION" | "GAME" | "GAMEOVER";
interface SpaceExperienceProps { onGameStateChange?: (state: GameState) => void; gameOnly?: boolean }

export default function SpaceExperience({ onGameStateChange, gameOnly = false }: SpaceExperienceProps) {
  const t = useTranslations("game"), locale = useLocale();
  const reducedMotion = useReducedMotion();
  const [audio] = useState(() => new SpaceAudio());
  const [music, setMusic] = useState(true), [effects, setEffects] = useState(true);
  const [gameState, setGameState] = useState<GameState>("SATURN");
  const [score, setScore] = useState(0), [stars, setStars] = useState(0);
  const [run, setRun] = useState(0);
  const [runId, setRunId] = useState("");
  const [ticket, setTicket] = useState<RunTicket | null>(null);
  const [paused, setPaused] = useState(false), [entering, setEntering] = useState(false);
  const [telemetry, setTelemetry] = useState({ shields: 3, combo: 0, speed: 26 });
  const touchInput = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const ticketRequest = useRef<AbortController | null>(null);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = gameState === "GAME" || gameState === "GAMEOVER";
  const active = gameState !== "SATURN";
  const flying = gameState === "GAME" && !paused && !entering;
  useEffect(() => {
    document.documentElement.classList.toggle("space-flight-active", flying);
    return () => document.documentElement.classList.remove("space-flight-active");
  }, [flying]);

  useEffect(() => { onGameStateChange?.(gameState); }, [gameState, onGameStateChange]);
  useEffect(() => { audio.setOptions(music, effects); }, [audio, music, effects]);
  useEffect(() => { audio.setFlight(gameState === "GAME" && !paused && !entering); }, [audio, gameState, paused, entering]);
  useEffect(() => () => { audio.dispose(); ticketRequest.current?.abort(); if (readyTimer.current) clearTimeout(readyTimer.current); }, [audio]);

  const triggerTransition = useCallback(() => {
    audio.unlock();
    ticketRequest.current?.abort();
    const controller = new AbortController(); ticketRequest.current = controller;
    setTicket(null); setRunId(crypto.randomUUID()); setEntering(true); setPaused(false);
    setGameState("TRANSITION");
    void fetch(spaceApi("start"), { method: "POST", headers: { "X-Space-Player": playerKey() }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        if (!controller.signal.aborted && result.id && result.token) setTicket(result);
      }).catch(() => undefined);
  }, [audio]);

  const autoStarted = useRef(false);
  useEffect(() => { if (gameOnly && !autoStarted.current) { autoStarted.current = true; queueMicrotask(triggerTransition); } }, [gameOnly, triggerTransition]);

  const startGame = useCallback(() => {
    touchInput.current = { x: 0, y: 0 };
    setTelemetry({ shields: 3, combo: 0, speed: 26 }); setScore(0); setStars(0);
    setRun((previous) => previous + 1); setGameState("GAME");
  }, []);
  const exitGame = useCallback(() => {
    if (gameOnly) return;
    ticketRequest.current?.abort();
    if (readyTimer.current) clearTimeout(readyTimer.current);
    audio.setFlight(false);
    touchInput.current = { x: 0, y: 0 };
    setPaused(false); setEntering(false); setGameState("SATURN");
  }, [audio, gameOnly]);
  const flightReady = useCallback(() => {
    if (readyTimer.current) clearTimeout(readyTimer.current);
    readyTimer.current = setTimeout(() => { setEntering(false); audio.play("launch"); }, reducedMotion ? 100 : 450);
  }, [audio, reducedMotion]);
  useEffect(() => {
    if (gameState !== "TRANSITION") return;
    const timer = window.setTimeout(startGame, reducedMotion ? 250 : 1400);
    return () => window.clearTimeout(timer);
  }, [gameState, startGame, reducedMotion]);

  useEffect(() => {
    if (!active) return;
    const previousFocus = document.activeElement, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; containerRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyP" && !(event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]"))) { event.preventDefault(); exitGame(); }
      if (event.key === "Escape" && gameState === "GAME" && !entering && !event.repeat &&
        !(event.target instanceof HTMLElement && event.target.closest("input, textarea"))) {
        event.preventDefault(); audio.unlock(); setPaused((value) => !value);
      }
      if (event.key !== "Tab") return;
      const controls = containerRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']");
      const visible = Array.from(controls ?? []).filter((element) => element.getClientRects().length > 0);
      if (!visible.length) { event.preventDefault(); return; }
      const first = visible[0], last = visible[visible.length - 1], focused = document.activeElement;
      if (event.shiftKey && (focused === first || focused === containerRef.current || !containerRef.current?.contains(focused))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (focused === last || !containerRef.current?.contains(focused))) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, gameState, entering, exitGame, audio]);
  useEffect(() => {
    if (gameState !== "GAME") return;
    const pause = () => setPaused(true), hidden = () => { if (document.hidden) pause(); };
    window.addEventListener("blur", pause); document.addEventListener("visibilitychange", hidden);
    return () => { window.removeEventListener("blur", pause); document.removeEventListener("visibilitychange", hidden); };
  }, [gameState]);

  const updateProgress = useCallback((progress: FlightProgress) => {
    setScore(progress.score); setStars(progress.stars);
    setTelemetry({ shields: progress.shields, combo: progress.combo, speed: progress.speed });
  }, []);
  const handleGameOver = useCallback((finalScore: number, finalStars: number) => {
    audio.setFlight(false); audio.play("end");
    setScore(finalScore); setStars(finalStars); setGameState("GAMEOVER");
  }, [audio]);
  const playSound = useCallback((sound: SpaceSound) => audio.play(sound), [audio]);
  const moveJoystick = useCallback((x: number, y: number) => { touchInput.current.x = x; touchInput.current.y = y; }, []);
  const curtain = gameState === "TRANSITION" || entering;
  const audioControls = <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t("audioHelp")}>
    <button type="button" aria-pressed={music} onClick={() => { audio.unlock(); setMusic(!music); }} className={`rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs ${music ? "text-[var(--accent)]" : "text-[var(--text-muted)] line-through"}`}>♪ {t("music")}</button>
    <button type="button" aria-pressed={effects} onClick={() => { audio.unlock(); setEffects(!effects); }} className={`rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs ${effects ? "text-[var(--accent)]" : "text-[var(--text-muted)] line-through"}`}>♫ {t("sounds")}</button>
  </div>;

  const experience = <div ref={containerRef} data-space-flight={flying ? "true" : "false"} data-accent="home" dir={isRtl(locale) ? "rtl" : "ltr"}
    className={`${active ? "fixed z-[100]" : "absolute"} inset-0 overflow-hidden bg-[var(--bg)] text-[var(--text)] outline-none`}
    role={active ? "dialog" : undefined} aria-modal={active ? true : undefined} aria-label={active ? t("title") : undefined} tabIndex={active ? -1 : undefined}
    onPointerDownCapture={() => audio.unlock()}>
    <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ antialias: true, powerPreference: "high-performance" }} dpr={[1, 1.5]}
      style={{ touchAction: "none", background: inFlight ? "radial-gradient(ellipse at 72% 22%, #251608 0%, transparent 48%), radial-gradient(ellipse at 18% 75%, #14111a 0%, #07080b 65%)" : "var(--bg)" }}>
      <Suspense fallback={<Html center><span role="status" className="whitespace-nowrap text-xs text-[var(--accent)]">{t(inFlight ? "loading" : "orbitLoading")}</span></Html>}>
        <Environment resolution={128} frames={1}>
          <Lightformer form="ring" color="#b8d8ff" intensity={3} scale={10} position={[0, 5, -10]} />
          <Lightformer color="#ffffff" intensity={3} scale={[8, 3, 1]} position={[5, 4, 5]} rotation={[0, -Math.PI / 4, 0]} />
          <Lightformer color="#ffb86b" intensity={1} scale={[5, 8, 1]} position={[-5, 0, 3]} rotation={[0, Math.PI / 4, 0]} />
        </Environment>
        <Stars radius={100} depth={50} count={2500} factor={4} saturation={0} fade speed={reducedMotion ? 0 : 1} />
        {!inFlight && <SaturnScene isTransitioning={gameState === "TRANSITION"} />}
        {inFlight && <GameScene key={run} onGameOver={handleGameOver} onProgress={updateProgress} touchInput={touchInput} isGameOver={gameState === "GAMEOVER"} paused={paused || entering} onReady={flightReady} onSound={playSound} />}
      </Suspense>
    </Canvas>
    {!active && !gameOnly && <button type="button" data-cursor="button" data-cursor-label={t("enter")} onClick={triggerTransition} className="absolute bottom-28 start-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--accent)] bg-[var(--bg)]/80 px-6 py-3 text-xs font-semibold text-[var(--accent)] backdrop-blur rtl:translate-x-1/2">{t("play")} ↗</button>}
    {inFlight && !curtain && <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-[var(--bg)] to-transparent px-5 pb-8 pt-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] sm:px-8">
      <div><div className="text-[10px] text-[var(--text-muted)]">{t("title")}</div><div className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{score.toLocaleString(locale)}</div><div className="mt-1 text-[10px] text-[var(--accent)]">{t("speed", { value: telemetry.speed.toLocaleString(locale) })}</div></div>
      <div className="text-end"><div className="text-xs text-[var(--accent)]">✦ {stars.toLocaleString(locale)} {t("stars")} {telemetry.combo > 1 && <span className="ms-2 rounded bg-[var(--surface)] px-2 py-1">×{telemetry.combo.toLocaleString(locale)}</span>}</div><div className="mt-3 flex justify-end gap-1.5" aria-label={t("shields", { count: gameState === "GAMEOVER" ? 0 : telemetry.shields })}>{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 w-7 rounded-full ${gameState !== "GAMEOVER" && i < telemetry.shields ? "bg-[var(--accent)] shadow-[0_0_10px_var(--glow)]" : "bg-[var(--border)]"}`} />)}</div></div>
    </div>}
    {gameState === "GAME" && !paused && !curtain && <>
      <div className="space-audio-controls absolute inset-x-5 top-[10rem] flex flex-wrap items-center justify-end gap-2 sm:inset-x-8">{audioControls}<button type="button" onClick={() => setPaused(true)} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs">{t("pause")} · Esc</button></div>
      <div className="space-hint pointer-events-none absolute inset-x-4 bottom-40 text-center text-[10px] text-[var(--text-muted)]">{t("hint")}</div>
      <GameControls allowExit={!gameOnly} onMove={moveJoystick} onExit={exitGame} />
    </>}
    {gameState === "GAME" && paused && !curtain && <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-[var(--bg)]/90 p-6 text-center backdrop-blur-md"><div className="my-auto max-w-md py-6">
      {gameOnly && <div className="mb-4 flex justify-center"><LanguageSwitcher /></div>}<p className="mb-3 text-xs text-[var(--accent)]">{t("hold")}</p><h2 className="text-4xl font-bold">{t("takeBreath")}</h2><p className="mt-4 text-sm text-[var(--text-muted)]">{t("resumeText")}</p>
      <div className="mt-5">{audioControls}</div><button onClick={() => { audio.unlock(); setPaused(false); }} className="mt-6 rounded-full bg-[var(--accent)] px-8 py-3 font-bold text-[var(--bg)]">{t("resume")}</button>
      <button onClick={() => handleGameOver(score, stars)} className="mx-auto mt-3 block rounded-full border border-[var(--border)] px-6 py-3 text-sm text-[var(--accent)]">{t("endRun")}</button>{!gameOnly && <button onClick={exitGame} className="mx-auto mt-3 block p-3 text-sm text-[var(--text-muted)]">{t("exit")}</button>}
    </div></div>}
    {gameState === "GAMEOVER" && <div className="absolute inset-0 overflow-y-auto bg-[var(--bg)]/90 px-4 py-6 backdrop-blur-md sm:px-6"><div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center pb-8 pt-16 text-center">
      <p className="mb-3 text-xs text-[var(--accent)]">{t("debrief")}</p><h2 className="text-4xl font-black sm:text-5xl">{t("complete")}</h2><p className="mt-3 text-sm text-[var(--text-muted)]">{t("completeText")}</p>
      <div className="my-6 flex items-center justify-center gap-10"><div><div className="text-[10px] text-[var(--text-muted)]">{t("finalScore")}</div><div className="mt-1 text-3xl tabular-nums">{score.toLocaleString(locale)}</div></div><div><div className="text-[10px] text-[var(--text-muted)]">{t("starsCollected")}</div><div className="mt-1 text-3xl text-[var(--accent)]">{stars.toLocaleString(locale)}</div></div></div>
      <GameLeaderboard key={runId} score={score} stars={stars} ticket={ticket} /><button onClick={triggerTransition} className="mt-6 w-full rounded-full bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-[var(--bg)]">{t("restart")} ↗</button>{!gameOnly && <button onClick={exitGame} className="mt-2 p-3 text-xs text-[var(--text-muted)] underline underline-offset-4">{t("exit")}</button>}
    </div></div>}
    {inFlight && !curtain && <>
      <div className="pointer-events-none absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.5rem,env(safe-area-inset-top))] z-30">
        <Image src="/assets/branding/zo7al-projects.png" width={177} height={81} alt="Zo7al Projects" className="h-auto w-[124px] sm:w-[142px]" priority />
      </div>
      <p className="pointer-events-none absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-30 text-[10px] text-[var(--text-muted)]">{t("version", { version: GAME_VERSION })}</p>
    </>}
    <AnimatePresence>{curtain && <motion.div key="launch" initial={{ opacity: gameState === "TRANSITION" ? 0 : 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0.1 : 0.6 }} className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-[var(--bg)]" role="status">
      {!reducedMotion && <div className="absolute inset-0" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <div key={i} className="absolute start-1/2 top-1/2" style={{ transform: `rotate(${i * 360 / 28}deg)` }}><motion.div className="h-40 w-px origin-top bg-gradient-to-b from-transparent to-[var(--accent)]" animate={{ scaleY: [0.1, 4], y: [40, 550], opacity: [0, 0.75, 0] }} transition={{ duration: 1.4, delay: i % 5 * 0.06, repeat: Infinity }} /></div>)}</div>}
      <motion.div initial={{ scale: reducedMotion ? 1 : 0.94 }} animate={{ scale: 1 }} className="relative max-w-lg px-6 text-center"><div className="mx-auto mb-6 h-16 w-16 rounded-full border border-[var(--accent)] shadow-[0_0_100px_var(--glow)]" /><h2 className="text-3xl font-bold sm:text-5xl">{t("launchTitle")}</h2><p className="mt-4 text-sm text-[var(--text-muted)]">{t(gameState === "TRANSITION" ? "launchText" : "loading")}</p>{!gameOnly && <button onClick={exitGame} className="mt-8 px-4 py-2 text-xs text-[var(--text-muted)]">{t("exit")}</button>}</motion.div>
    </motion.div>}</AnimatePresence>
  </div>;
  return active ? createPortal(experience, document.body) : experience;
}
