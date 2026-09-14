"use client";

import React, { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars, Environment, Float } from "@react-three/drei";
import SaturnScene from "./SaturnScene";
import GameScene from "./GameScene";

type GameState = "SATURN" | "TRANSITION" | "GAME" | "GAMEOVER";

interface SpaceExperienceProps {
  onGameStateChange?: (state: GameState) => void;
}

export default function SpaceExperience({ onGameStateChange }: SpaceExperienceProps) {
  const [gameState, setGameState] = useState<GameState>("SATURN");
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    onGameStateChange?.(gameState);
    if (gameState === "GAME" || gameState === "GAMEOVER") {
      document.documentElement.classList.add("cursor-hidden");
    } else {
      document.documentElement.classList.remove("cursor-hidden");
    }
    return () => {
      document.documentElement.classList.remove("cursor-hidden");
    };
  }, [gameState, onGameStateChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (gameState === "GAME" || gameState === "GAMEOVER")) {
        setGameState("SATURN");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  const triggerTransition = () => {
    setGameState("TRANSITION");
    setTimeout(() => {
      startGame();
    }, 2000);
  };

  const startGame = () => {
    setGameState("GAME");
  };

  const handleGameOver = (finalScore: number, finalStars: number) => {
    setScore(finalScore);
    setStars(finalStars);
    setGameState("GAMEOVER");
  };

  const restartGame = () => {
    setScore(0);
    setStars(0);
    setGameState("GAME");
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <Canvas
        shadows
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Environment preset="night" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {gameState === "SATURN" && (
            <SaturnScene onTrigger={triggerTransition} />
          )}

          {gameState === "TRANSITION" && (
            <SaturnScene onTrigger={startGame} isTransitioning />
          )}

          {gameState === "GAME" && (
            <GameScene
              onGameOver={handleGameOver}
              score={score}
              stars={stars}
            />
          )}

          {gameState === "GAMEOVER" && (
            <GameScene
              onGameOver={handleGameOver}
              score={score}
              stars={stars}
              isGameOver
            />
          )}
        </Suspense>
      </Canvas>

      {/* HUD Overlay */}
      {(gameState === "GAME" || gameState === "GAMEOVER") && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-start justify-start p-8 text-white font-mono">
          <div className="flex gap-12 text-2xl font-bold uppercase tracking-widest">
            <div>Score: {score}</div>
            <div>Stars: {stars}</div>
          </div>
        </div>
      )}

      {/* Game Over UI */}
      {gameState === "GAMEOVER" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col items-center text-center text-white">
            <h2 className="text-6xl font-black uppercase italic mb-4 tracking-tighter">Mission Failed</h2>
            <p className="text-xl mb-8 opacity-70">You collided with an asteroid.</p>
            <div className="flex gap-12 mb-10 text-2xl font-mono">
              <div>Final Score: {score}</div>
              <div>Stars: {stars}</div>
            </div>
            <button
              onClick={restartGame}
              className="px-10 py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors"
            >
              Restart Flight
            </button>
            <button
              onClick={() => setGameState("SATURN")}
              className="mt-4 text-sm opacity-50 hover:opacity-100 underline underline-offset-4"
            >
              Return to Orbit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
