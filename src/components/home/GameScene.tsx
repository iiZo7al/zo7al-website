"use client";

import { useRef, useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import {
  CAMERA_FOLLOW, FLIGHT_CAMERA_DISTANCE, FLIGHT_CAMERA_FOV, FLIGHT_SPEED,
  getFlightBounds, readFlightInput, stepFlight, type FlightInput,
} from "./rocket-motion";
import { useSpaceModels } from "./SpaceModels";
import { MAX_SHIELDS, STAR_BONUS, sweptHit } from "./space-game-rules";

export interface FlightProgress { score: number; stars: number; shields: number; combo: number; speed: number }
interface GameSceneProps {
  onGameOver: (score: number, stars: number) => void;
  onProgress: (progress: FlightProgress) => void;
  touchInput: RefObject<FlightInput>;
  isGameOver?: boolean;
  paused?: boolean;
}
type Obstacle = { object: THREE.Group; radius: number; spin: number };
type Burst = { object: THREE.Points; life: number };

export default function GameScene({ onGameOver, onProgress, touchInput, isGameOver, paused }: GameSceneProps) {
  const models = useSpaceModels();
  const rocketRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const flameRef = useRef<THREE.Group>(null);
  const worldRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const dustRef = useRef<THREE.Points>(null);
  const keys = useRef(new Set<string>());
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const reducedMotion = useRef(false);
  const data = useRef({ speed: 26, score: 0, stars: 0, shields: MAX_SHIELDS, combo: 0,
    asteroids: [] as Obstacle[], starsInFlight: [] as Obstacle[], bursts: [] as Burst[],
    lastSpawn: 0, lastStar: -1, elapsed: 0, lastHud: 0, invulnerableUntil: 0, lastCollection: -10, ended: false });
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
    const reset = () => { pressed.clear(); };
    reset();
    if (paused || isGameOver) return;
    const codes = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) { reset(); return; }
      if (codes.has(e.code)) { e.preventDefault(); pressed.add(e.code); }
    };
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
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
    };
  }, [paused, isGameOver, touchInput]);

  useEffect(() => {
    const current = data.current;
    return () => {
      [...current.asteroids, ...current.starsInFlight].forEach(({ object }) => object.removeFromParent());
      current.bursts.forEach(({ object }) => {
        object.removeFromParent(); object.geometry.dispose(); (object.material as THREE.Material).dispose();
      });
      current.asteroids = []; current.starsInFlight = []; current.bursts = [];
    };
  }, []);

  const burst = (position: THREE.Vector3, color: string) => {
    if (!worldRef.current || reducedMotion.current) return;
    const vertices = new Float32Array(54);
    for (let i = 0; i < vertices.length; i++) vertices[i] = (Math.random() - 0.5) * 0.4;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color, size: 0.13, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const object = new THREE.Points(geometry, material);
    object.position.copy(position);
    worldRef.current.add(object);
    data.current.bursts.push({ object, life: 0.55 });
  };

  useFrame((state, delta) => {
    const g = data.current;
    if (isGameOver || paused || g.ended || document.hidden || !worldRef.current) return;
    const dt = Math.min(delta, 1 / 20);
    const oldRocket = { ...motion.current };
    const bounds = getFlightBounds(state.size.width / Math.max(1, state.size.height), state.size.height);
    stepFlight(motion.current, readFlightInput(keys.current, touchInput.current), bounds, dt);
    const { x, y, vx, vy } = motion.current;
    g.elapsed += dt;
    const time = g.elapsed;
    g.speed = Math.min(58, 26 + time * 0.28);
    g.score += g.speed * 8 * dt;
    if (time - g.lastCollection > 5) g.combo = 0;

    if (rocketRef.current) {
      rocketRef.current.position.set(x, y, 0);
      rocketRef.current.rotation.z = THREE.MathUtils.damp(rocketRef.current.rotation.z, -vx / FLIGHT_SPEED * (reducedMotion.current ? 0.05 : 0.3), 12, dt);
      rocketRef.current.rotation.x = THREE.MathUtils.damp(rocketRef.current.rotation.x, vy / FLIGHT_SPEED * 0.1, 12, dt);
      if (shieldRef.current) shieldRef.current.visible = time < g.invulnerableUntil;
    }
    if (flameRef.current) flameRef.current.scale.y = reducedMotion.current ? 1 : 1 + Math.sin(time * 35) * 0.12;
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
      const object = (star ? models.star : models.meteor).clone(true);
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
        g.shields--; g.combo = 0; g.invulnerableUntil = time + 1.5;
        burst(item.object.position, "#ff7547");
        item.object.removeFromParent();
        return false;
      }
      if (item.object.position.z > 12) { item.object.removeFromParent(); return false; }
      return true;
    });
    if (g.shields <= 0) { g.ended = true; onGameOver(Math.floor(g.score), g.stars); return; }
    g.starsInFlight = g.starsInFlight.filter((item) => {
      if (advance(item)) {
        g.stars++; g.combo = Math.min(5, g.combo + 1); g.lastCollection = time;
        g.score += STAR_BONUS * g.combo;
        if (g.stars % 10 === 0) g.shields = Math.min(MAX_SHIELDS, g.shields + 1);
        burst(item.object.position, "#ffd96d");
        item.object.removeFromParent(); return false;
      }
      if (item.object.position.z > 12) { item.object.removeFromParent(); return false; }
      return true;
    });
    g.bursts = g.bursts.filter((particle) => {
      particle.life -= dt;
      particle.object.scale.addScalar(dt * 6);
      (particle.object.material as THREE.PointsMaterial).opacity = Math.max(0, particle.life / 0.55);
      if (particle.life <= 0) {
        particle.object.removeFromParent(); particle.object.geometry.dispose(); (particle.object.material as THREE.Material).dispose(); return false;
      }
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
      <directionalLight position={[4, 7, 6]} intensity={4} color="#fff2dc" />
      <directionalLight position={[-6, 1, -4]} intensity={3} color="#72bcff" />
      <points ref={dustRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[dust, 3]} /></bufferGeometry>
        <pointsMaterial color="#bddeff" size={0.065} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
      </points>
      <group ref={worldRef} dispose={null} />
      <group ref={rocketRef}>
        <mesh ref={shieldRef} visible={false} scale={[1, 1.4, 1]}>
          <sphereGeometry args={[0.68, 16, 12]} />
          <meshBasicMaterial color="#80d9ff" transparent opacity={0.22} wireframe depthWrite={false} />
        </mesh>
        <group rotation={[-0.65, 0, 0]}>
          <primitive object={models.rocket} dispose={null} />
          <group ref={flameRef} position={[0, -0.7, 0]}>
            <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.13, 0.85, 16]} />
              <meshBasicMaterial color="#72cfff" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh position={[0, -0.18, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.065, 0.5, 12]} />
              <meshBasicMaterial color="#e1f6ff" toneMapped={false} />
            </mesh>
            <pointLight color="#67bbff" intensity={8} distance={4} decay={2} />
          </group>
        </group>
      </group>
    </>
  );
}
