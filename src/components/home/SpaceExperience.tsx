"use client";

import { useState, Suspense, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { Stars, Environment, Html } from "@react-three/drei";
import SaturnScene from "./SaturnScene";
import GameScene from "./GameScene";
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
  const touchInput = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inFlight = gameState === "GAME" || gameState === "GAMEOVER";

  useEffect(() => { onGameStateChange?.(gameState); }, [gameState, onGameStateChange]);

  const startGame = useCallback(() => {
    touchInput.current = { x: 0, y: 0 };
    setScore(0);
    setStars(0);
    setRun((previous) => previous + 1);
    setGameState("GAME");
  }, []);

  const exitGame = useCallback(() => {
    touchInput.current = { x: 0, y: 0 };
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
      if (event.key !== "Tab" || !inFlight) return;
      const controls = containerRef.current?.querySelectorAll<HTMLElement>("button, [tabindex='0']");
      const visibleControls = Array.from(controls ?? []).filter((element) => element.getClientRects().length > 0);
      if (!visibleControls.length) return;
      const first = visibleControls[0];
      const last = visibleControls[visibleControls.length - 1];
      const focused = document.activeElement;
      if (event.shiftKey && (focused === first || focused === containerRef.current)) {
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

  const triggerTransition = useCallback(() => {
    setGameState((previous) => previous === "SATURN" ? "TRANSITION" : previous);
  }, []);

  const updateProgress = useCallback((nextScore: number, nextStars: number) => {
    setScore(nextScore);
    setStars(nextStars);
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
        shadows
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={<Html center><span role="status" className="whitespace-nowrap font-mono text-xs tracking-widest text-orange-200">{inFlight ? "Preparing flight..." : "Loading orbit..."}</span></Html>}>
          <Environment preset="night" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          {!inFlight && <SaturnScene onTrigger={triggerTransition} isTransitioning={gameState === "TRANSITION"} />}
          {inFlight && (
            <GameScene
              key={run}
              onGameOver={handleGameOver}
              onProgress={updateProgress}
              touchInput={touchInput}
              isGameOver={gameState === "GAMEOVER"}
            />
          )}
        </Suspense>
      </Canvas>

      {inFlight && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-6 px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] font-mono text-white sm:px-8">
          <div><div className="text-[10px] uppercase tracking-[0.24em] text-white/50">Score</div><div className="text-2xl font-bold tabular-nums sm:text-3xl">{score.toLocaleString("en-US")}</div></div>
          <div className="text-right"><div className="text-[10px] uppercase tracking-[0.24em] text-orange-300">Stars</div><div className="text-2xl font-bold tabular-nums sm:text-3xl">{stars}</div></div>
        </div>
      )}

      {gameState === "GAME" && <GameControls onMove={moveJoystick} onExit={exitGame} />}

      {gameState === "GAMEOVER" && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/60 p-6 backdrop-blur-sm">
          <div className="flex max-w-lg flex-col items-center text-center text-white">
            <h2 className="mb-4 text-4xl font-black uppercase italic tracking-tighter sm:text-6xl">Mission Failed</h2>
            <p className="mb-8 text-base text-white/70 sm:text-xl">You collided with an asteroid.</p>
            <div className="mb-10 flex flex-wrap justify-center gap-6 font-mono text-lg sm:text-2xl">
              <div>Final Score: {score.toLocaleString("en-US")}</div><div>Stars: {stars}</div>
            </div>
            <button onClick={startGame} className="rounded-full bg-white px-10 py-4 font-bold uppercase tracking-widest text-black transition-colors hover:bg-orange-500">Restart Flight</button>
            <button onClick={exitGame} className="mt-4 p-3 text-sm text-white/60 underline underline-offset-4 hover:text-white">Return to Orbit</button>
          </div>
        </div>
      )}
    </div>
  );

  // Portaling the active game avoids clipping by page transitions and keeps
  // touch controls inside the phone viewport, independent of the hero height.
  return inFlight ? createPortal(experience, document.body) : experience;
}
