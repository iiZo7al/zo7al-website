"use client";

import { useRef, useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import {
  CAMERA_FOLLOW, FLIGHT_CAMERA_DISTANCE, FLIGHT_CAMERA_FOV,
  getFlightBounds, readFlightInput, stepPointerFlight, stepFlight, type FlightInput,
} from "./rocket-motion";
import EnginePlume from "./EnginePlume";
import { makeBurst, stepBurst, disposeBurst, type FlightBurst } from "./flight-effects";
import { useSpacePack, DistantWorlds } from "./SpacePack";
import type { SpaceSound } from "./space-audio";
import { useSpaceModels } from "./SpaceModels";
import { MAX_SHIELDS, STAR_BONUS, sweptHit } from "./space-game-rules";

export interface FlightProgress { score: number; stars: number; shields: number; combo: number; speed: number }
interface GameSceneProps {
  onGameOver: (score: number, stars: number) => void;
  onProgress: (progress: FlightProgress) => void;
  touchInput: RefObject<FlightInput>;
  isGameOver?: boolean;
  paused?: boolean;
  onReady: () => void;
  onSound: (sound: SpaceSound) => void;
}
type Obstacle = { object: THREE.Group; radius: number; spin: number };


export default function GameScene({ onGameOver, onProgress, touchInput, isGameOver, paused, onReady, onSound }: GameSceneProps) {
  const models = useSpaceModels();
  const pack = useSpacePack();
  useEffect(() => { onReady(); }, [onReady]);
  const rocketRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const worldRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const dustRef = useRef<THREE.Points>(null);
  const pointer = useRef({ active: false, x: 0, y: 0 });
  const pointerRay = useMemo(() => new THREE.Raycaster(), []);
  const flightPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const pointerWorld = useMemo(() => new THREE.Vector3(), []);
  const keys = useRef(new Set<string>());
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const reducedMotion = useRef(false);
  const data = useRef({ speed: 26, score: 0, stars: 0, shields: MAX_SHIELDS, combo: 0,
    asteroids: [] as Obstacle[], starsInFlight: [] as Obstacle[], bursts: [] as FlightBurst[],
    hitAt: -10, lastSpawn: 0, lastStar: -1, elapsed: 0, lastHud: 0, invulnerableUntil: 0, lastCollection: -10, ended: false });
  // Deterministic seed avoids render-time randomness and hydration differences.
  const dust = useMemo(() => {
    const positions = new Float32Array(700 * 3);
    let seed = 71;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (random() - 0.5) * 140;
      positions[i + 1] = (random() - 0.5) * 100;
      positions[i + 2] = -random() * 140;
    }
    return positions;
  }, []);

  useEffect(() => {
    const pressed = keys.current;
    const reset = () => { pressed.clear(); pointer.current.active = false; };
    reset();
    if (paused || isGameOver) return;
    const codes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) { reset(); return; }
      if (codes.has(e.code)) { e.preventDefault(); pressed.add(e.code);
        if (pointer.current.active) { motion.current.vx = 0; motion.current.vy = 0; }
        pointer.current.active = false; }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !(e.target instanceof HTMLCanvasElement)) return;
      const bounds = e.target.getBoundingClientRect();
      pointer.current = { active: true, x: (e.clientX - bounds.left) / bounds.width * 2 - 1, y: 1 - (e.clientY - bounds.top) / bounds.height * 2 };
    };
    window.addEventListener("pointermove", move);
    const up = (e: KeyboardEvent) => { pressed.delete(e.code); };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { reducedMotion.current = media.matches; };
    preference();
    media.addEventListener("change", preference);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    return () => {
      reset();
      media.removeEventListener("change", preference);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
    };
  }, [paused, isGameOver, touchInput]);

  useEffect(() => {
    const current = data.current;
    return () => {
      [...current.asteroids, ...current.starsInFlight].forEach(({ object }) => object.removeFromParent());
      current.bursts.forEach(disposeBurst);
      current.asteroids = []; current.starsInFlight = []; current.bursts = [];
    };
  }, []);

  const burst = (position: THREE.Vector3, impact: boolean) => {
    if (!worldRef.current) return;
    const effect = makeBurst(position, impact, reducedMotion.current);
    worldRef.current.add(effect.object); data.current.bursts.push(effect);
  };

  useFrame((state, delta) => {
    const g = data.current;
    if (paused || document.hidden || !worldRef.current) return;
    g.bursts = g.bursts.filter((particle) => stepBurst(particle, Math.min(delta, 0.05)));
    if (isGameOver || g.ended) return;
    const dt = Math.min(delta, 1 / 20);
    const oldRocket = { ...motion.current };
    const bounds = getFlightBounds(state.size.width / Math.max(1, state.size.height), state.size.height);
    const input = readFlightInput(keys.current, touchInput.current);
    if (keys.current.size || Math.hypot(touchInput.current.x, touchInput.current.y) > 0) pointer.current.active = false;
    let pointerMoved = false;
    if (pointer.current.active) {
      pointerRay.setFromCamera(new THREE.Vector2(pointer.current.x, pointer.current.y), state.camera);
      if (pointerRay.ray.intersectPlane(flightPlane, pointerWorld)) {
        stepPointerFlight(motion.current, pointerWorld, bounds, dt);
        pointerMoved = true;
      }
    }
    if (!pointerMoved) stepFlight(motion.current, input, bounds, dt);
    const { x, y } = motion.current;
    g.elapsed += dt;
    const time = g.elapsed;
    g.speed = Math.min(58, 26 + time * 0.28);
    g.score += g.speed * 8 * dt;
    if (time - g.lastCollection > 5) g.combo = 0;

    if (rocketRef.current) {
      rocketRef.current.position.set(x, y, 0);
      rocketRef.current.rotation.set(0, 0, 0);
      if (bodyRef.current) bodyRef.current.rotation.y = reducedMotion.current ? 0 : time * 0.16;
    }

    if (cameraRef.current) {
      cameraRef.current.position.x = THREE.MathUtils.damp(THREE.MathUtils.clamp(cameraRef.current.position.x, -bounds.x * CAMERA_FOLLOW, bounds.x * CAMERA_FOLLOW), x * CAMERA_FOLLOW, 5, dt);
      cameraRef.current.position.y = THREE.MathUtils.damp(THREE.MathUtils.clamp(cameraRef.current.position.y, -bounds.y * CAMERA_FOLLOW, bounds.y * CAMERA_FOLLOW), y * CAMERA_FOLLOW, 5, dt);
    }
    if (dustRef.current && !reducedMotion.current) {
      const attr = dustRef.current.geometry.getAttribute("position");
      for (let i = 0; i < attr.count; i++) { const z = attr.getZ(i) + g.speed * dt * 0.7; attr.setZ(i, z > 15 ? -125 : z); }
      attr.needsUpdate = true;
    }

    const spawn = (star: boolean) => {
      const source = star ? models.star : Math.random() < 0.45 ? models.meteor : pack.obstacles[Math.floor(Math.random() * pack.obstacles.length)];
      const object = source.clone(true);
      const size = star ? 1 : 0.9 + Math.random() * 1.1;
      object.scale.multiplyScalar(size);
      object.position.set((Math.random() * 2 - 1) * bounds.x * 0.9, (Math.random() * 2 - 1) * bounds.y * 0.9, -85);
      // Keep new collectibles clear of rocks arriving at the same time.
      if (star && g.asteroids.some((a) => a.object.position.distanceTo(object.position) < 3)) return;
      if (!star) object.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      worldRef.current!.add(object);
      (star ? g.starsInFlight : g.asteroids).push({ object, radius: star ? 0.55 : size * 0.5, spin: (Math.random() - 0.5) * 1.2 });
    };
    if (time - g.lastSpawn > Math.max(0.42, 1.25 - time * 0.008)) { spawn(false); g.lastSpawn = time; }
    if (time - g.lastStar > 1.35) { spawn(true); g.lastStar = time; }

    const advance = (item: Obstacle) => {
      const from = { x: item.object.position.x - oldRocket.x, y: item.object.position.y - oldRocket.y, z: item.object.position.z };
      item.object.position.z += g.speed * dt;
      if (!reducedMotion.current) { item.object.rotation.y += item.spin * dt; item.object.rotation.z += item.spin * dt * 0.4; }
      const to = { x: item.object.position.x - x, y: item.object.position.y - y, z: item.object.position.z };
      return sweptHit(from, to, item.radius + 0.48);
    };
    g.asteroids = g.asteroids.filter((item) => {
      const hit = advance(item);
      if (hit && time >= g.invulnerableUntil) {
        onSound("hit");
        g.shields--; g.combo = 0; g.invulnerableUntil = time + 1.5;
        g.hitAt = time;
        burst(new THREE.Vector3(x, y, 0), true);
        item.object.removeFromParent();
        return false;
      }
      if (item.object.position.z > 12) { item.object.removeFromParent(); return false; }
      return true;
    });
    if (g.shields <= 0) { g.ended = true; onGameOver(Math.floor(g.score), g.stars); return; }
    g.starsInFlight = g.starsInFlight.filter((item) => {
      if (advance(item)) {
        onSound("collect");
        g.stars++; g.combo = Math.min(5, g.combo + 1); g.lastCollection = time;
        g.score += STAR_BONUS * g.combo;
        if (g.stars % 10 === 0) { g.shields = Math.min(MAX_SHIELDS, g.shields + 1); onSound("shield"); }
        burst(item.object.position, false);
        item.object.removeFromParent(); return false;
      }
      if (item.object.position.z > 12) { item.object.removeFromParent(); return false; }
      return true;
    });
    if (time - g.lastHud >= 0.1) {
      onProgress({ score: Math.floor(g.score), stars: g.stars, shields: g.shields, combo: g.combo, speed: Math.round(g.speed) });
      g.lastHud = time;
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, FLIGHT_CAMERA_DISTANCE]} fov={FLIGHT_CAMERA_FOV} />
      <hemisphereLight intensity={1.4} color="#b8d4ff" groundColor="#16102b" />
      <directionalLight position={[4, 7, 6]} intensity={2} color="#fff2dc" />
      <directionalLight position={[-6, 1, -4]} intensity={1} color="#b8d4ff" />
      <points ref={dustRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[dust, 3]} /></bufferGeometry>
        <pointsMaterial color="#bddeff" size={0.065} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
      </points>
      <DistantWorlds worlds={pack.scenery} paused={Boolean(paused || isGameOver)} />
      <group ref={worldRef} dispose={null} />
      <group ref={rocketRef}>
        <group rotation={[-1.25, 0, 0]}>
          <group ref={bodyRef}>
            <primitive object={models.rocket} dispose={null} />
            <EnginePlume paused={Boolean(paused || isGameOver)} />
          </group>
        </group>
      </group>
    </>
  );
}
