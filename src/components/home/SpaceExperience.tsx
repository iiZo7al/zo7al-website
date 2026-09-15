"use client";

import { useState, Suspense, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { Stars, Environment, Lightformer, Html } from "@react-three/drei";
import SaturnScene from "./SaturnScene";
import GameScene, { type FlightProgress } from "./GameScene";
import GameLeaderboard from "./GameLeaderboard";
import GameControls from "./GameControls";

type GameState = "SATURN" | "TRANSITION" | "GAME" | "GAMEOVER";

interface SpaceExperienceProps {
  onGameStateChange?: (state: GameState) => void;
}

export default function SpaceExperience({ onGameStateChange }: SpaceExperienceProps) {
  const [gameState, setGameState] = useState<GameState>("SATURN");
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [run, setRun] = useState(0);
  const [runId, setRunId] = useState("");
  const [paused, setPaused] = useState(false);
  const [telemetry, setTelemetry] = useState({ shields: 3, combo: 0, speed: 26 });
  const touchInput = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inFlight = gameState === "GAME" || gameState === "GAMEOVER";

  useEffect(() => { onGameStateChange?.(gameState); }, [gameState, onGameStateChange]);

  const startGame = useCallback(() => {
    touchInput.current = { x: 0, y: 0 };
    setPaused(false);
    setRunId(crypto.randomUUID());
    setTelemetry({ shields: 3, combo: 0, speed: 26 });
    setScore(0);
    setStars(0);
    setRun((previous) => previous + 1);
    setGameState("GAME");
  }, []);

  const exitGame = useCallback(() => {
    touchInput.current = { x: 0, y: 0 };
    setPaused(false);
    setGameState("SATURN");
  }, []);

  useEffect(() => {
    if (gameState !== "TRANSITION") return;
    const timer = window.setTimeout(startGame, 2000);
    return () => window.clearTimeout(timer);
  }, [gameState, startGame]);

  useEffect(() => {
    if (!inFlight) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    containerRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [inFlight]);

  useEffect(() => {
    if (gameState === "SATURN") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        exitGame();
      }
      if (event.code === "KeyP" && gameState === "GAME" && !event.repeat &&
        !(event.target instanceof HTMLElement && event.target.closest("input, textarea"))) {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key !== "Tab" || !inFlight) return;
      const controls = containerRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']");
      const visibleControls = Array.from(controls ?? []).filter((element) => element.getClientRects().length > 0);
      if (!visibleControls.length) return;
      const first = visibleControls[0];
      const last = visibleControls[visibleControls.length - 1];
      const focused = document.activeElement;
      if (event.shiftKey && (focused === first || focused === containerRef.current || !containerRef.current?.contains(focused))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (focused === last || !containerRef.current?.contains(focused))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, inFlight, exitGame]);

  useEffect(() => {
    if (gameState !== "GAME") return;
    const pause = () => setPaused(true);
    const hidden = () => { if (document.hidden) pause(); };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [gameState]);

  const triggerTransition = useCallback(() => {
    setGameState((previous) => previous === "SATURN" ? "TRANSITION" : previous);
  }, []);

  const updateProgress = useCallback((progress: FlightProgress) => {
    setScore(progress.score);
    setStars(progress.stars);
    setTelemetry({ shields: progress.shields, combo: progress.combo, speed: progress.speed });
  }, []);

  const handleGameOver = useCallback((finalScore: number, finalStars: number) => {
    setScore(finalScore);
    setStars(finalStars);
    setGameState("GAMEOVER");
  }, []);

  const moveJoystick = useCallback((x: number, y: number) => {
    touchInput.current.x = x;
    touchInput.current.y = y;
  }, []);

  const experience = (
    <div
      ref={containerRef}
      className={`${inFlight ? "fixed z-[100]" : "absolute"} inset-0 overflow-hidden bg-black outline-none`}
      role={inFlight ? "dialog" : undefined}
      aria-modal={inFlight ? true : undefined}
      aria-label={inFlight ? "ZO7AL Space Run" : undefined}
      tabIndex={inFlight ? -1 : undefined}
      dir="ltr"
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ touchAction: "none", background: inFlight ? "radial-gradient(ellipse at 72% 22%, #102034 0%, transparent 48%), radial-gradient(ellipse at 18% 75%, #160f25 0%, #02040a 65%)" : "#000" }}
      >
        <Suspense fallback={<Html center><span role="status" className="whitespace-nowrap font-mono text-xs tracking-widest text-orange-200">{inFlight ? "Preparing flight..." : "Loading orbit..."}</span></Html>}>
          <Environment resolution={128} frames={1}>
            <Lightformer form="ring" color="#b8d8ff" intensity={3} scale={10} position={[0, 5, -10]} />
            <Lightformer color="#ffffff" intensity={3} scale={[8, 3, 1]} position={[5, 4, 5]} rotation={[0, -Math.PI / 4, 0]} />
            <Lightformer color="#ffb86b" intensity={1} scale={[5, 8, 1]} position={[-5, 0, 3]} rotation={[0, Math.PI / 4, 0]} />
          </Environment>
          <Stars radius={100} depth={50} count={2500} factor={4} saturation={0} fade speed={1} />
          {!inFlight && <SaturnScene onTrigger={triggerTransition} isTransitioning={gameState === "TRANSITION"} />}
          {inFlight && (
            <GameScene
              key={run}
              onGameOver={handleGameOver}
              onProgress={updateProgress}
              touchInput={touchInput}
              isGameOver={gameState === "GAMEOVER"}
              paused={paused}
            />
          )}
        </Suspense>
      </Canvas>

      {gameState === "SATURN" && (
        <button type="button" onClick={startGame} className="absolute bottom-28 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-200/40 bg-black/65 px-6 py-3 text-xs font-semibold text-amber-100 backdrop-blur hover:bg-amber-200 hover:text-black">Play Space Run ↗</button>
      )}

      {inFlight && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-5 pb-12 pt-[max(1.25rem,env(safe-area-inset-top))] font-mono text-white sm:px-8">
          <div><div className="text-[9px] uppercase tracking-[0.22em] text-white/45">ZO7AL / Space Run</div><div className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{score.toLocaleString("en-US")}</div><div className="mt-1 text-[10px] text-sky-200">{telemetry.speed} km/s</div></div>
          <div className="text-right"><div className="text-xs text-amber-200">✦ {stars} stars {telemetry.combo > 1 && <span className="ml-2 rounded bg-amber-300/15 px-2 py-1">×{telemetry.combo}</span>}</div><div className="mt-3 flex justify-end gap-1.5" aria-label={`${gameState === "GAMEOVER" ? 0 : telemetry.shields} shields remaining`}>{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 w-7 rounded-full ${gameState !== "GAMEOVER" && i < telemetry.shields ? "bg-sky-300 shadow-[0_0_10px_#7dd3fc70]" : "bg-white/15"}`} />)}</div></div>
        </div>
      )}

      {gameState === "GAME" && !paused && <>
        <button type="button" onClick={() => setPaused(true)} className="absolute right-5 top-28 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs text-white sm:right-8" aria-label="Pause flight">Pause · P</button>
        <div className="pointer-events-none absolute inset-x-0 bottom-36 text-center text-[10px] tracking-wide text-white/45">Collect stars · Chain up to ×5 · 10 stars restore a shield</div>
        <GameControls onMove={moveJoystick} onExit={exitGame} />
      </>}

      {gameState === "GAME" && paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center text-white backdrop-blur-md">
          <div><p className="mb-3 font-mono text-xs tracking-[0.3em] text-sky-200">FLIGHT ON HOLD</p><h2 className="text-4xl font-bold">Take a breath.</h2><p className="mt-4 text-sm text-white/55">Your flight will resume when you are ready.</p><button onClick={() => setPaused(false)} className="mt-8 rounded-full bg-amber-300 px-8 py-3 font-bold text-black">Resume flight</button><button onClick={() => handleGameOver(score, stars)} className="mx-auto mt-3 block rounded-full border border-white/20 px-6 py-3 text-sm text-amber-200">End run &amp; view leaderboard</button><button onClick={exitGame} className="mx-auto mt-3 block p-3 text-sm text-white/60">Return to orbit</button></div>
        </div>
      )}

      {gameState === "GAMEOVER" && (
        <div className="pointer-events-auto absolute inset-0 overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center py-8 text-center text-white">
            <p className="mb-3 font-mono text-[10px] tracking-[0.3em] text-amber-200">MISSION DEBRIEF</p>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Flight complete.</h2>
            <p className="mt-3 text-sm text-white/50">Collect stars. Go further. Beat your personal best.</p>
            <div className="my-6 flex items-center justify-center gap-10 font-mono"><div><div className="text-[10px] uppercase tracking-wider text-white/40">Final score</div><div className="mt-1 text-3xl tabular-nums">{score.toLocaleString("en-US")}</div></div><div><div className="text-[10px] uppercase tracking-wider text-white/40">Stars collected</div><div className="mt-1 text-3xl text-amber-200">{stars}</div></div></div>
            <GameLeaderboard key={runId} score={score} stars={stars} runId={runId} />
            <button onClick={startGame} className="mt-6 w-full rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black transition-colors hover:bg-amber-300">Launch again ↗</button>
            <button onClick={exitGame} className="mt-2 p-3 text-xs text-white/60 underline underline-offset-4 hover:text-white">Return to orbit</button>
          </div>
        </div>
      )}
    </div>
  );

  // Portaling the active game avoids clipping by page transitions and keeps
  // touch controls inside the phone viewport, independent of the hero height.
  return inFlight ? createPortal(experience, document.body) : experience;
}

