"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three/addons/utils/SkeletonUtils.js";
import * as THREE from "three";

const ROCKET_URL = "/assets/models/rocket-v101/Rocket.glb";
const MIKU_URL = "/assets/models/miku/hatsune_miku_fornite.glb";
const ROCKET_AXIS = new THREE.Vector3(-0.36537422, 0.78477997, 0.5006217).normalize();

function centeredClone(source: THREE.Object3D, height: number, skeleton = false) {
  const clone = skeleton ? SkeletonUtils.clone(source) : source.clone(true);
  clone.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(clone);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  clone.position.sub(center);
  clone.scale.multiplyScalar(height / Math.max(size.x, size.y, size.z, 0.001));
  return clone;
}

function FlybyScene({ onComplete }: { onComplete: () => void }) {
  const flight = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);
  const completed = useRef(false);
  const { scene: rocketSource } = useGLTF(ROCKET_URL);
  const { scene: mikuSource } = useGLTF(MIKU_URL);
  const rocket = useMemo(() => {
    const model = centeredClone(rocketSource, 2.15);
    model.quaternion.setFromUnitVectors(ROCKET_AXIS, new THREE.Vector3(0, 1, 0));
    model.updateMatrixWorld(true);
    return model;
  }, [rocketSource]);
  const miku = useMemo(() => centeredClone(mikuSource, 1.2, true), [mikuSource]);

  useFrame((state) => {
    if (!flight.current || completed.current) return;
    if (startTime.current === null) startTime.current = state.clock.elapsedTime;
    const progress = THREE.MathUtils.clamp((state.clock.elapsedTime - startTime.current) / 3.4, 0, 1);
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const halfWidth = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect;
    const eased = progress * progress * (3 - 2 * progress);
    flight.current.position.x = THREE.MathUtils.lerp(-halfWidth - 3.4, halfWidth + 3.4, eased);
    flight.current.position.y = 0.1 + Math.sin(progress * Math.PI) * 0.16;
    if (progress >= 1) {
      completed.current = true;
      flight.current.visible = false;
      onComplete();
    }
  });

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[2, 5, 6]} intensity={2.2} color="#fff0d8" />
      <directionalLight position={[-4, 1, 3]} intensity={0.8} color="#a8d8ff" />
      <group ref={flight} rotation={[0, 0, -Math.PI / 2]} visible>
        <primitive object={rocket} dispose={null} />
        <group position={[0, 0.88, 0.38]} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={miku} dispose={null} />
        </group>
      </group>
    </>
  );
}

export default function MikuRocketFlyby({ onComplete }: { onComplete: () => void }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} dpr={[1, 1.25]} style={{ background: "transparent", pointerEvents: "none" }}>
        <Suspense fallback={null}>
          <FlybyScene onComplete={onComplete} />
        </Suspense>
      </Canvas>
    </div>
  );
}
