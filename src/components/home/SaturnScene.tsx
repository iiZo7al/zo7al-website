"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { discoverFirstEasterEgg } from "@/lib/data/easter-eggs";

interface SaturnSceneProps {
  isTransitioning?: boolean;
}

interface PointerCaptureTarget {
  setPointerCapture: (pointerId: number) => void;
  releasePointerCapture: (pointerId: number) => void;
  hasPointerCapture: (pointerId: number) => boolean;
}

const RING_RADIUS = 5;
const RING_TILT = -Math.PI / 2.5;
const CAMERA_FOV = 45;
const ORBIT_NORMAL = new THREE.Vector3(0, -Math.sin(RING_TILT), Math.cos(RING_TILT));
const ORBIT_AXIS = new THREE.Vector3(0, Math.cos(RING_TILT), Math.sin(RING_TILT));
const KONAMI_CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const DEBRIS_DIRECTIONS = Array.from({ length: 20 }, (_, index) => {
  const phi = Math.acos(1 - 2 * (index + 0.5) / 20);
  const theta = index * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi));
});

export default function SaturnScene({ isTransitioning }: SaturnSceneProps) {
  const moonRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Group>(null);
  const debrisRefs = useRef<Array<THREE.Mesh | null>>([]);
  const explosionLightRef = useRef<THREE.PointLight>(null);
  const explosionStart = useRef<number | null>(null);
  const sequence = useRef<string[]>([]);
  const [explosionId, setExplosionId] = useState(0);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const size = useThree((state) => state.size);
  const canvas = useThree((state) => state.gl.domElement);
  const angle = useRef(0);
  const velocity = useRef(0);
  const activePointer = useRef<number | null>(null);
  const captureTarget = useRef<PointerCaptureTarget | null>(null);
  const lastPointerAngle = useRef(0);
  const lastPointerTime = useRef(0);
  const reducedMotion = useRef(false);
  const intersection = useRef(new THREE.Vector3());
  const orbitPlane = useRef(new THREE.Plane());

  // Fit the complete orbit, including its depth, on both wide and portrait screens.
  const halfVerticalFov = THREE.MathUtils.degToRad(CAMERA_FOV / 2);
  const halfHorizontalFov = Math.atan(Math.tan(halfVerticalFov) * Math.max(size.width, 1) / Math.max(size.height, 1));
  const cameraDistance = (RING_RADIUS + 1) / Math.sin(Math.min(halfVerticalFov, halfHorizontalFov));

  useEffect(() => {
    if (isTransitioning) return;
    velocity.current = 0;
    activePointer.current = null;
    cameraRef.current?.position.set(0, 0, cameraDistance);
  }, [isTransitioning, cameraDistance]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isTransitioning) { sequence.current = []; return; }
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]")) {
        sequence.current = [];
        return;
      }
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const expected = KONAMI_CODE[sequence.current.length];
      if (key === expected) {
        event.preventDefault();
        event.stopImmediatePropagation();
        sequence.current.push(key);
        if (sequence.current.length === KONAMI_CODE.length) {
          sequence.current = [];
          discoverFirstEasterEgg();
          setExplosionId((value) => value + 1);
        }
      } else {
        sequence.current = key === KONAMI_CODE[0] ? [key] : [];
        if (sequence.current.length) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isTransitioning]);

  useEffect(() => {
    if (explosionId > 0) explosionStart.current = performance.now();
  }, [explosionId]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => { reducedMotion.current = preference.matches; };
    updatePreference();
    preference.addEventListener("change", updatePreference);

    const finishDrag = (cancelled = true) => {
      const pointerId = activePointer.current;
      activePointer.current = null;
      if (cancelled) velocity.current = 0;
      if (pointerId !== null && captureTarget.current?.hasPointerCapture(pointerId)) {
        captureTarget.current.releasePointerCapture(pointerId);
      }
      captureTarget.current = null;
    };
    const cancelDrag = () => finishDrag();
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId === activePointer.current) finishDrag(false);
    };
    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerId === activePointer.current) cancelDrag();
    };
    let lostCaptureFrame = 0;
    const onLostPointerCapture = (event: PointerEvent) => {
      // Some browsers dispatch lost capture before pointerup; let the release finish first.
      cancelAnimationFrame(lostCaptureFrame);
      lostCaptureFrame = requestAnimationFrame(() => {
        if (event.pointerId === activePointer.current) cancelDrag();
      });
    };
    const onVisibilityChange = () => {
      if (document.hidden) cancelDrag();
    };
    window.addEventListener("blur", cancelDrag);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("lostpointercapture", onLostPointerCapture);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelDrag();
      cancelAnimationFrame(lostCaptureFrame);
      preference.removeEventListener("change", updatePreference);
      window.removeEventListener("blur", cancelDrag);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("lostpointercapture", onLostPointerCapture);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [canvas]);

  useFrame((state, frameDelta) => {
    const delta = Math.min(frameDelta, 0.05);
    if (!moonRef.current) return;

    if (planetRef.current && explosionStart.current !== null) {
      const elapsed = (performance.now() - explosionStart.current) / 1000;
      if (elapsed >= 2.2) {
        explosionStart.current = null;
        planetRef.current.visible = true;
        planetRef.current.scale.setScalar(1);
        if (explosionLightRef.current) explosionLightRef.current.intensity = 0;
        debrisRefs.current.forEach((mesh) => { if (mesh) mesh.visible = false; });
      } else {
        const planet = planetRef.current;
        if (elapsed < 0.22) {
          planet.visible = true;
          planet.scale.setScalar(1 + elapsed / 0.22 * 0.2);
        } else if (elapsed < 0.62) {
          planet.scale.setScalar(1.2 * (1 - (elapsed - 0.22) / 0.4));
        } else if (elapsed < 1.3) {
          planet.visible = false;
        } else {
          planet.visible = true;
          const reform = THREE.MathUtils.clamp((elapsed - 1.3) / 0.75, 0, 1);
          planet.scale.setScalar(reform * reform * (3 - 2 * reform));
        }
        if (explosionLightRef.current) {
          explosionLightRef.current.intensity = Math.max(0, 1 - elapsed / 0.5) * 32;
        }
        debrisRefs.current.forEach((mesh, index) => {
          if (!mesh) return;
          const debrisAge = elapsed - 0.12;
          mesh.visible = debrisAge > 0 && debrisAge < 1.25;
          if (mesh.visible) {
            const distance = 1.5 + debrisAge * 5;
            mesh.position.copy(DEBRIS_DIRECTIONS[index]).multiplyScalar(distance);
            mesh.scale.setScalar(Math.max(0.04, 0.24 * (1 - debrisAge / 1.35)));
          }
        });
      }
    }

    if (activePointer.current === null) {
      angle.current += ((reducedMotion.current ? 0 : 0.12) + velocity.current) * delta;
      velocity.current *= Math.exp(-2.5 * delta);
    }

    const orbitalOffset = Math.sin(angle.current) * RING_RADIUS;
    moonRef.current.position.set(
      Math.cos(angle.current) * RING_RADIUS,
      orbitalOffset * ORBIT_AXIS.y,
      orbitalOffset * ORBIT_AXIS.z,
    );

    if (isTransitioning && cameraRef.current && !reducedMotion.current) {
      cameraRef.current.position.z = THREE.MathUtils.damp(cameraRef.current.position.z, 2, 3, delta);
    } else if (groupRef.current) {
      groupRef.current.position.y = reducedMotion.current ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  const getPointerAngle = (event: ThreeEvent<PointerEvent>) => {
    const group = groupRef.current;
    if (!group) return null;
    // Use the orbit plane rather than the moving moon's surface intersection.
    group.updateWorldMatrix(true, false);
    orbitPlane.current.set(ORBIT_NORMAL, 0).applyMatrix4(group.matrixWorld);
    if (!event.ray.intersectPlane(orbitPlane.current, intersection.current)) return null;
    group.worldToLocal(intersection.current);
    return Math.atan2(intersection.current.dot(ORBIT_AXIS), intersection.current.x);
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches || isTransitioning || activePointer.current !== null || event.button !== 0) return;
    const pointerAngle = getPointerAngle(event);
    if (pointerAngle === null) return;
    event.stopPropagation();
    activePointer.current = event.pointerId;
    lastPointerAngle.current = pointerAngle;
    lastPointerTime.current = event.timeStamp;
    velocity.current = 0;
    captureTarget.current = event.target as unknown as PointerCaptureTarget;
    captureTarget.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (activePointer.current !== event.pointerId || isTransitioning) return;
    event.stopPropagation();
    const pointerAngle = getPointerAngle(event);
    if (pointerAngle === null) return;
    const difference = pointerAngle - lastPointerAngle.current;
    const change = Math.atan2(Math.sin(difference), Math.cos(difference));
    const elapsed = Math.max((event.timeStamp - lastPointerTime.current) / 1000, 1 / 240);
    angle.current += change;
    velocity.current = THREE.MathUtils.clamp(THREE.MathUtils.lerp(velocity.current, change / elapsed, 0.65), -0.6, 0.6);
    lastPointerAngle.current = pointerAngle;
    lastPointerTime.current = event.timeStamp;
  };

  const releasePointer = (event: ThreeEvent<PointerEvent>, cancelled = false) => {
    if (activePointer.current !== event.pointerId) return;
    event.stopPropagation();
    activePointer.current = null;
    if (cancelled) velocity.current = 0;
    if (captureTarget.current?.hasPointerCapture(event.pointerId)) {
      captureTarget.current.releasePointerCapture(event.pointerId);
    }
    captureTarget.current = null;
  };

  return (
    <>
    <PerspectiveCamera ref={cameraRef} makeDefault fov={CAMERA_FOV} position={[0, 0, cameraDistance]} />
    <group ref={groupRef}>
      <group ref={planetRef}>
      {/* Saturn Body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#ff7a00"
          roughness={0.7}
          emissive="#ff7a00"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Saturn Ring */}
      <mesh rotation={[RING_TILT, 0, 0]}>
        <ringGeometry args={[2.5, RING_RADIUS, 64]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      </group>

      {/* Debris briefly scatters outward before Saturn reforms. */}
      {DEBRIS_DIRECTIONS.map((_, index) => <mesh key={index} ref={(mesh) => { debrisRefs.current[index] = mesh; }} visible={false}>
        <icosahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color={index % 2 ? "#ffb86b" : "#ff7a00"} emissive="#ff6a00" emissiveIntensity={1.8} />
      </mesh>)}
      <pointLight ref={explosionLightRef} position={[0, 0, 0]} intensity={0} color="#ff9a32" distance={24} />

      {/* The visible moon stays the same size; a clear hit area makes it easier to grab on touchscreens. */}
      <group
        ref={moonRef}
        onPointerDown={handlePointerDown}
        onPointerUp={(event) => releasePointer(event)}
        onPointerMove={handlePointerMove}
        onPointerCancel={(event) => releasePointer(event, true)}
        onLostPointerCapture={(event) => releasePointer(event, true)}
      >
        <mesh castShadow>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#FFB86C" emissive="#FF8E00" emissiveIntensity={0.5} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* Ambient Glow */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#ff7a00" />
    </group>
    </>
  );
}

