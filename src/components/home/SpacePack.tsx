"use client";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import manifest from "../../../public/assets/models/space-pack/manifest.json";
const root = "/assets/models/space-pack/";
const paths = manifest.map((item) => root + item.model);
const texturePaths = manifest.flatMap((item) => [root + item.color, root + item.normal, root + item.roughness]);

export function useSpacePack() {
  const sources = useLoader(GLTFLoader, paths);
  const textures = useLoader(THREE.TextureLoader, texturePaths);
  const prepared = useMemo(() => {
    const maps = textures.map((texture, index) => {
      const clone = texture.clone();
      // OBJ UVs retain the TextureLoader convention in these geometry-only GLBs.
      clone.colorSpace = index % 3 === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      return clone;
    });
    const materials = manifest.map((item, index) => new THREE.MeshStandardMaterial({
      map: maps[index * 3], normalMap: maps[index * 3 + 1], roughnessMap: maps[index * 3 + 2],
      roughness: 0.8, metalness: ["Satellite", "Sputnik", "UFO", "SpaceCapsule"].includes(item.name) ? 0.45 : 0.08,
    }));
    const models = sources.map((source, index) => {
      const clone = source.scene.clone(true);
      clone.traverse((child) => { if (child instanceof THREE.Mesh) child.material = materials[index]; });
      return clone;
    });
    return { obstacles: models.slice(0, 6), scenery: models.slice(6), materials, maps };
  }, [sources, textures]);
  useEffect(() => () => { prepared.materials.forEach((m) => m.dispose()); prepared.maps.forEach((m) => m.dispose()); }, [prepared]);
  return prepared;
}

export function DistantWorlds({ worlds, paused }: { worlds: THREE.Group[]; paused: boolean }) {
  const reducedMotion = useReducedMotion();
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current || paused || reducedMotion) return;
    group.current.children.forEach((child, index) => { child.rotation.y += Math.min(delta, 0.05) * (0.025 + index * 0.009); });
  });
  return <group ref={group} dispose={null}>
    {worlds.map((world, i) => <primitive key={i} object={world} position={[[ -24, 12, -68 ], [20, -12, -76], [36, 20, -90], [-40, -20, -110]][i]} scale={[16, 11, 18, 22][i]} dispose={null} />)}
  </group>;
}
