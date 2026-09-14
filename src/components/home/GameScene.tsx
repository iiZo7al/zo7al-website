"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

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

const findFirstMesh = (group: THREE.Group): THREE.Mesh | null => {
  let found: THREE.Mesh | null = null;
  group.traverse((child) => {
    if (!found && child instanceof THREE.Mesh) {
      found = child;
    }
  });
  return found;
};

export default function GameScene({ onGameOver, score, stars, isGameOver }: GameSceneProps) {
  const rocketRef = useRef<THREE.Group>(null);
  const worldRef = useRef<THREE.Group>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentStars, setCurrentStars] = useState(0);
  const [input, setInput] = useState({ left: false, right: false });

  // Load Models
  const rocketModel = useLoader(OBJLoader, "/assets/models/rocket/d6e7e6e798b14ef489a13333300853d1.obj");
  const starModel = useLoader(OBJLoader, "/assets/models/star/8d8d7c521b43427a99e6df007004564a.obj");
  const meteorModel = useLoader(OBJLoader, "/assets/models/meteor/60136dbdd0434b48a763385058f651f7.obj");

  // Apply materials from MTL files
  useEffect(() => {
    const applyMaterials = async (model: THREE.Group, mtlPath: string) => {
      try {
        const mtlLoader = new MTLLoader();
        const materials = await mtlLoader.loadAsync(mtlPath);
        materials.preload();
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const matName = child.material.name;
            if (materials.materials[matName]) {
              child.material = materials.materials[matName];
            }
          }
        });
      } catch (e) {
        console.error(`Failed to load MTL at ${mtlPath}:`, e);
      }
    };

    applyMaterials(rocketModel, "/assets/models/rocket/model.mtl");
    applyMaterials(starModel, "/assets/models/star/model.mtl");
    applyMaterials(meteorModel, "/assets/models/meteor/model.mtl");
  }, [rocketModel, starModel, meteorModel]);

  const gameData = useRef({
    speed: ASTEROID_SPEED,
    score: 0,
    collectedStars: 0,
    asteroids: [] as THREE.Mesh[],
    stars: [] as THREE.Mesh[],
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

    if (rocketRef.current) {
      const moveSpeed = 15 * delta;
      if (input.left) rocketRef.current.position.x -= moveSpeed;
      if (input.right) rocketRef.current.position.x += moveSpeed;
      rocketRef.current.position.x = THREE.MathUtils.clamp(rocketRef.current.position.x, -10, 10);
      rocketRef.current.rotation.z = THREE.MathUtils.lerp(rocketRef.current.rotation.z, input.left ? 0.2 : input.right ? -0.2 : 0, 0.1);
    }

    const time = state.clock.getElapsedTime();
    gameData.current.speed += 0.0001;

    gameData.current.asteroids.forEach((ast) => {
      ast.position.z += gameData.current.speed;
    });
    gameData.current.stars.forEach((st) => {
      st.position.z += gameData.current.speed;
    });

    if (time - gameData.current.lastSpawnTime > 1.5 / (gameData.current.speed / ASTEROID_SPEED)) {
      spawnAsteroid();
      gameData.current.lastSpawnTime = time;
    }

    if (time - gameData.current.lastStarSpawnTime > 3) {
      spawnStar();
      gameData.current.lastStarSpawnTime = time;
    }

    const rocketPos = rocketRef.current?.position || { x: 0, y: 0, z: 0 };

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

    gameData.current.score += Math.floor(gameData.current.speed * 10);
    setCurrentScore(gameData.current.score);
    setCurrentStars(gameData.current.collectedStars);
  });

  const spawnAsteroid = () => {
    if (!worldRef.current) return;
    const group = meteorModel.clone();
    const sourceMesh = findFirstMesh(group);
    if (!sourceMesh) return;

    const asteroid = sourceMesh.clone();
    asteroid.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      -ASTEROID_SPAWN_DIST
    );
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    asteroid.scale.setScalar(Math.random() * 1 + 0.5);

    worldRef.current.add(asteroid);
    gameData.current.asteroids.push(asteroid);
  };

  const spawnStar = () => {
    if (!worldRef.current) return;
    const group = starModel.clone();
    const sourceMesh = findFirstMesh(group);
    if (!sourceMesh) return;

    const star = sourceMesh.clone();
    star.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      -STAR_SPAWN_DIST
    );

    worldRef.current.add(star);
    gameData.current.stars.push(star);
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} rotation={[-0.2, 0, 0]} />
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
