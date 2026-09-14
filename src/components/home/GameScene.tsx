"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, Text } from "@react-three/drei";
import * as THREE from "three";

interface GameSceneProps {
  onGameOver: (score: number, stars: number) => void;
  score: number;
  stars: number;
  isGameOver?: boolean;
}

const ASTEROID_SPAWN_DIST = 100;
const ASTEROID_SPEED = 0.5;
const STAR_SPAWN_DIST = 100;
const STAR_SPEED = 0.5;

export default function GameScene({ onGameOver, score, stars, isGameOver }: GameSceneProps) {
  const rocketRef = useRef<THREE.Group>(null);
  const worldRef = useRef<THREE.Group>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentStars, setCurrentStars] = useState(0);
  const [input, setInput] = useState({ left: false, right: false });

  // Game state references to avoid re-renders in useFrame
  const gameData = useRef({
    speed: ASTEROID_SPEED,
    score: 0,
    collectedStars: 0,
    asteroids: [] as any[],
    stars: [] as any[],
    lastSpawnTime: 0,
    lastStarSpawnTime: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "ArrowLeft") setInput((p) => ({ ...p, left: true }));
      if (e.key === "d" || e.key === "ArrowRight") setInput((p) => ({ ...p, right: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "ArrowLeft") setInput((p) => ({ ...p, left: false }));
      if (e.key === "d" || e.key === "ArrowRight") setInput((p) => ({ ...p, right: false }));
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (isGameOver) return;

    // 1. Movement
    if (rocketRef.current) {
      const moveSpeed = 15 * delta;
      if (input.left) rocketRef.current.position.x -= moveSpeed;
      if (input.right) rocketRef.current.position.x += moveSpeed;
      // Clamp rocket position
      rocketRef.current.position.x = THREE.MathUtils.clamp(rocketRef.current.position.x, -10, 10);
      // Tilt rocket slightly when moving
      rocketRef.current.rotation.z = THREE.MathUtils.lerp(rocketRef.current.rotation.z, input.left ? 0.2 : input.right ? -0.2 : 0, 0.1);
    }

    // 2. World Movement & Spawning
    const time = state.clock.getElapsedTime();
    gameData.current.speed += 0.0001; // Gradually increase difficulty

    // Move asteroids and stars towards rocket (simulating forward flight)
    gameData.current.asteroids.forEach((ast) => {
      ast.position.z += gameData.current.speed;
    });
    gameData.current.stars.forEach((st) => {
      st.position.z += gameData.current.speed;
    });

    // Spawn Asteroids
    if (time - gameData.current.lastSpawnTime > 1.5 / (gameData.current.speed / ASTEROID_SPEED)) {
      spawnAsteroid();
      gameData.current.lastSpawnTime = time;
    }

    // Spawn Stars
    if (time - gameData.current.lastStarSpawnTime > 3) {
      spawnStar();
      gameData.current.lastStarSpawnTime = time;
    }

    // 3. Collision & Cleanup
    const rocketPos = rocketRef.current?.position || { x: 0, y: 0, z: 0 };

    // Asteroid Collision
    gameData.current.asteroids = gameData.current.asteroids.filter((ast) => {
      const dist = ast.position.distanceTo(rocketPos);
      if (dist < 1.5) {
        onGameOver(gameData.current.score, gameData.current.collectedStars);
        return false;
      }
      if (ast.position.z > 10) {
        worldRef.current?.remove(ast);
        return false;
      }
      return true;
    });

    // Star Collection
    gameData.current.stars = gameData.current.stars.filter((st) => {
      const dist = st.position.distanceTo(rocketPos);
      if (dist < 2) {
        gameData.current.collectedStars++;
        worldRef.current?.remove(st);
        return false;
      }
      if (st.position.z > 10) {
        worldRef.current?.remove(st);
        return false;
      }
      return true;
    });

    // Update score
    gameData.current.score += Math.floor(gameData.current.speed * 10);
    setCurrentScore(gameData.current.score);
    setCurrentStars(gameData.current.collectedStars);
  });

  const spawnAsteroid = () => {
    if (!worldRef.current) return;
    const geometry = new THREE.IcosahedronGeometry(Math.random() * 1 + 0.5, 0);
    const material = new THREE.MeshStandardMaterial({ color: "#555", roughness: 0.9 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      -ASTEROID_SPAWN_DIST
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    worldRef.current.add(mesh);
    gameData.current.asteroids.push(mesh);
  };

  const spawnStar = () => {
    if (!worldRef.current) return;
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: "#FFD700",
      emissive: "#FFFF00",
      emissiveIntensity: 2
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      -STAR_SPAWN_DIST
    );

    worldRef.current.add(mesh);
    gameData.current.stars.push(mesh);
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} rotation={[-0.2, 0, 0]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />

      <group ref={worldRef} />

      <group ref={rocketRef} position={[0, 0, 0]}>
        {/* Simple Rocket Model */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.6, 2, 16]} />
          <meshStandardMaterial color="#EEE" />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <coneGeometry args={[0.4, 0.8, 16]} />
          <meshStandardMaterial color="#FF4500" />
        </mesh>
        <mesh position={[0, -0.8, 0]}>
          <boxGeometry args={[0.8, 0.3, 0.8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {/* Engine glow */}
        <pointLight position={[0, -1, 0]} intensity={2} color="#FF8E00" />
      </group>
    </>
  );
}
