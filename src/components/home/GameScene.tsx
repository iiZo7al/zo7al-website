"use client";

import React, { useRef, useEffect, type RefObject } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import {
  CAMERA_FOLLOW, FLIGHT_CAMERA_DISTANCE, FLIGHT_CAMERA_FOV, FLIGHT_SPEED,
  getFlightBounds, readFlightInput, stepFlight, type FlightInput,
} from "./rocket-motion";

interface GameSceneProps {
  onGameOver: (score: number, stars: number) => void;
  onProgress: (score: number, stars: number) => void;
  touchInput: RefObject<FlightInput>;
  isGameOver?: boolean;
}

const ASTEROID_SPAWN_DIST = 100;
const ASTEROID_SPEED = 30;
const STAR_SPAWN_DIST = 100;
const materialLoads = new WeakMap<THREE.Group, Promise<void>>();

function prepareMaterials(model: THREE.Group, path: string): Promise<void> {
  const existing = materialLoads.get(model);
  if (existing) return existing;
  const loading = new MTLLoader().loadAsync(path).then((materials) => {
    materials.preload();
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const replace = (material: THREE.Material) => materials.materials[material.name] ?? material;
      child.material = Array.isArray(child.material) ? child.material.map(replace) : replace(child.material);
    });
  }).catch((error) => {
    materialLoads.delete(model);
    console.error(`Failed to load MTL at ${path}:`, error);
  });
  materialLoads.set(model, loading);
  return loading;
}

const findFirstMesh = (group: THREE.Group): THREE.Mesh | null => {
  let found: THREE.Mesh | null = null;
  group.traverse((child) => {
    if (!found && child instanceof THREE.Mesh) {
      found = child;
    }
  });
  return found;
};

export default function GameScene({ onGameOver, onProgress, touchInput, isGameOver }: GameSceneProps) {
  const rocketRef = useRef<THREE.Group>(null);
  const worldRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const keys = useRef(new Set<string>());
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const reducedMotion = useRef(false);

  // Load Models
  const rocketModel = useLoader(OBJLoader, "/assets/models/rocket/d6e7e6e798b14ef489a13333300853d1.obj");
  const starModel = useLoader(OBJLoader, "/assets/models/star/8d8d7c521b43427a99e6df007004564a.obj");
  const meteorModel = useLoader(OBJLoader, "/assets/models/meteor/60136dbdd0434b48a763385058f651f7.obj");

  // Loader models and their textures are shared across restarts. Initialize
  // them once instead of allocating another set of materials on each run.
  useEffect(() => {
    void prepareMaterials(rocketModel, "/assets/models/rocket/model.mtl");
    void prepareMaterials(starModel, "/assets/models/star/model.mtl");
    void prepareMaterials(meteorModel, "/assets/models/meteor/model.mtl");
  }, [rocketModel, starModel, meteorModel]);

  const gameData = useRef({
    speed: ASTEROID_SPEED,
    score: 0,
    collectedStars: 0,
    asteroids: [] as THREE.Mesh[],
    stars: [] as THREE.Mesh[],
    lastSpawnTime: 0,
    lastStarSpawnTime: 0,
    elapsed: 0,
    lastHudTime: 0,
    ended: false,
  });

  useEffect(() => {
    if (isGameOver) return;
    const pressed = keys.current;
    const flightMotion = motion.current;
    const codes = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);
    const reset = () => {
      pressed.clear();
      touchInput.current.x = 0;
      touchInput.current.y = 0;
      flightMotion.vx = 0;
      flightMotion.vy = 0;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) { reset(); return; }
      if (!codes.has(e.code)) return;
      e.preventDefault();
      pressed.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => { pressed.delete(e.code); };
    const visibilityChange = () => { if (document.hidden) reset(); };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => { reducedMotion.current = media.matches; };
    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibilityChange);
    return () => {
      reset();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibilityChange);
      media.removeEventListener("change", updateMotionPreference);
    };
  }, [isGameOver, touchInput]);

  const spawnAsteroid = (width: number, height: number) => {
    if (!worldRef.current) return;
    const group = meteorModel.clone();
    const sourceMesh = findFirstMesh(group);
    if (!sourceMesh) return;

    const asteroid = sourceMesh.clone();
    asteroid.position.set(
      (Math.random() - 0.5) * width * 2,
      (Math.random() - 0.5) * height * 2,
      -ASTEROID_SPAWN_DIST
    );
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    asteroid.scale.setScalar(Math.random() * 1 + 0.5);

    worldRef.current.add(asteroid);
    gameData.current.asteroids.push(asteroid);
  };

  const spawnStar = (width: number, height: number) => {
    if (!worldRef.current) return;
    const group = starModel.clone();
    const sourceMesh = findFirstMesh(group);
    if (!sourceMesh) return;

    const star = sourceMesh.clone();
    star.position.set(
      (Math.random() - 0.5) * width * 2,
      (Math.random() - 0.5) * height * 2,
      -STAR_SPAWN_DIST
    );

    worldRef.current.add(star);
    gameData.current.stars.push(star);
  };

  useFrame((state, delta) => {
    if (isGameOver || gameData.current.ended || document.hidden) return;
    const dt = Math.min(delta, 1 / 20);
    const bounds = getFlightBounds(state.size.width / Math.max(1, state.size.height), state.size.height);
    const input = readFlightInput(keys.current, touchInput.current);
    stepFlight(motion.current, input, bounds, dt);

    if (rocketRef.current) {
      const { x, y, vx, vy } = motion.current;
      rocketRef.current.position.set(x, y, 0);
      const tilt = reducedMotion.current ? 0.07 : 0.24;
      rocketRef.current.rotation.z = THREE.MathUtils.damp(rocketRef.current.rotation.z, -vx / FLIGHT_SPEED * tilt, 12, dt);
      rocketRef.current.rotation.x = THREE.MathUtils.damp(rocketRef.current.rotation.x, vy / FLIGHT_SPEED * tilt * 0.6, 12, dt);
      if (cameraRef.current) {
        // A viewport rotation can shrink the arena while the camera is still
        // following the previous wider bounds. Keep its lag inside the new view.
        cameraRef.current.position.x = THREE.MathUtils.clamp(cameraRef.current.position.x, -bounds.x * CAMERA_FOLLOW, bounds.x * CAMERA_FOLLOW);
        cameraRef.current.position.y = THREE.MathUtils.clamp(cameraRef.current.position.y, -bounds.y * CAMERA_FOLLOW, bounds.y * CAMERA_FOLLOW);
        cameraRef.current.position.x = THREE.MathUtils.damp(cameraRef.current.position.x, x * CAMERA_FOLLOW, 5, dt);
        cameraRef.current.position.y = THREE.MathUtils.damp(cameraRef.current.position.y, y * CAMERA_FOLLOW, 5, dt);
      }
    }

    gameData.current.elapsed += dt;
    const time = gameData.current.elapsed;
    gameData.current.speed = Math.min(65, gameData.current.speed + 0.36 * dt);

    gameData.current.asteroids.forEach((ast) => {
      ast.position.z += gameData.current.speed * dt;
    });
    gameData.current.stars.forEach((st) => {
      st.position.z += gameData.current.speed * dt;
    });

    if (time - gameData.current.lastSpawnTime > 1.5 / (gameData.current.speed / ASTEROID_SPEED)) {
      spawnAsteroid(bounds.x, bounds.y);
      gameData.current.lastSpawnTime = time;
    }

    if (time - gameData.current.lastStarSpawnTime > 3) {
      spawnStar(bounds.x, bounds.y);
      gameData.current.lastStarSpawnTime = time;
    }

    const rocketPos = rocketRef.current?.position || { x: 0, y: 0, z: 0 };

    const hit = gameData.current.asteroids.find((ast) => ast.position.distanceTo(rocketPos) < 1.5);
    if (hit) {
      gameData.current.ended = true;
      onGameOver(Math.floor(gameData.current.score), gameData.current.collectedStars);
      return;
    }
    gameData.current.asteroids = gameData.current.asteroids.filter((ast) => {
      if (ast.position.z > 10) {
        worldRef.current?.remove(ast);
        return false;
      }
      return true;
    });

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

    gameData.current.score += gameData.current.speed * 10 * dt;
    if (time - gameData.current.lastHudTime >= 0.1) {
      onProgress(Math.floor(gameData.current.score), gameData.current.collectedStars);
      gameData.current.lastHudTime = time;
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, FLIGHT_CAMERA_DISTANCE]} fov={FLIGHT_CAMERA_FOV} />
      <hemisphereLight intensity={0.8} color="#ffffff" groundColor="#000000" />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      <group ref={worldRef} />
      <group ref={rocketRef} position={[0, 0, 0]}>
        <primitive object={rocketModel} scale={1.2} />
        <pointLight position={[0, -1, 0]} intensity={3} color="#FF8E00" />
      </group>
    </>
  );
}
