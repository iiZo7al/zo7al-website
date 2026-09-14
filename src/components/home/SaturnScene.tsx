"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface SaturnSceneProps {
  onTrigger: () => void;
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

export default function SaturnScene({ onTrigger, isTransitioning }: SaturnSceneProps) {
  const moonRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const size = useThree((state) => state.size);
  const canvas = useThree((state) => state.gl.domElement);
  const angle = useRef(0);
  const velocity = useRef(0);
  const activePointer = useRef<number | null>(null);
  const captureTarget = useRef<PointerCaptureTarget | null>(null);
  const lastPointerAngle = useRef(0);
  const lastPointerTime = useRef(0);
  const didTrigger = useRef(false);
  const reducedMotion = useRef(false);
  const intersection = useRef(new THREE.Vector3());
  const orbitPlane = useRef(new THREE.Plane());

  // Fit the complete orbit, including its depth, on both wide and portrait screens.
  const halfVerticalFov = THREE.MathUtils.degToRad(CAMERA_FOV / 2);
  const halfHorizontalFov = Math.atan(Math.tan(halfVerticalFov) * Math.max(size.width, 1) / Math.max(size.height, 1));
  const cameraDistance = (RING_RADIUS + 1) / Math.sin(Math.min(halfVerticalFov, halfHorizontalFov));

  useEffect(() => {
    if (isTransitioning) return;
    didTrigger.current = false;
    velocity.current = 0;
    activePointer.current = null;
    cameraRef.current?.position.set(0, 0, cameraDistance);
  }, [isTransitioning, cameraDistance]);

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

    if (activePointer.current === null) {
      angle.current += velocity.current * delta;
      velocity.current *= Math.exp(-2.5 * delta);
    }

    const orbitalOffset = Math.sin(angle.current) * RING_RADIUS;
    moonRef.current.position.set(
      Math.cos(angle.current) * RING_RADIUS,
      orbitalOffset * ORBIT_AXIS.y,
      orbitalOffset * ORBIT_AXIS.z,
    );

    if (!isTransitioning && !didTrigger.current && Math.abs(velocity.current) > 8) {
      didTrigger.current = true;
      onTrigger();
    }

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
    if (isTransitioning || activePointer.current !== null || event.button !== 0) return;
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
    velocity.current = THREE.MathUtils.lerp(velocity.current, change / elapsed, 0.65);
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
