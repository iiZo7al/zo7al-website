"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface SaturnSceneProps {
  onTrigger: () => void;
  isTransitioning?: boolean;
}

export default function SaturnScene({ onTrigger, isTransitioning }: SaturnSceneProps) {
  const moonRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [angle, setAngle] = useState(0);

  // For velocity tracking
  const lastAngle = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);

  const RING_RADIUS = 5;

  useFrame((state, delta) => {
    if (!moonRef.current) return;

    // Handle Moon Rotation
    moonRef.current.position.x = Math.cos(angle) * RING_RADIUS;
    moonRef.current.position.z = Math.sin(angle) * RING_RADIUS;

    // Calculate Angular Velocity
    if (isDragging) {
      const dTheta = Math.abs(angle - lastAngle.current);
      const normalizedDTheta = dTheta > Math.PI ? Math.abs(2 * Math.PI - dTheta) : dTheta;

      velocity.current = normalizedDTheta / delta;
      lastAngle.current = angle;
    } else {
      velocity.current *= 0.95;
    }

    if (!isTransitioning && velocity.current > 8) {
      onTrigger();
    }

    if (isTransitioning) {
      state.camera.position.lerp(new THREE.Vector3(0, 0, 2), 0.05);
      state.camera.lookAt(0, 0, 0);
    } else {
      if (groupRef.current) {
        groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
      }
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    lastAngle.current = angle;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;

    // Project mouse position to XZ plane
    // We use the pointer coordinates relative to the center
    const x = e.point.x;
    const z = e.point.z;
    const newAngle = Math.atan2(z, x);
    setAngle(newAngle);
  };

  return (
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
      <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[2.5, RING_RADIUS, 64]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Interactive Moon */}
      <mesh
        ref={moonRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        castShadow
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#FFB86C" emissive="#FF8E00" emissiveIntensity={0.5} />
      </mesh>

      {/* Ambient Glow */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#ff7a00" />
    </group>
  );
}
