"use client";

import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const root = "/assets/models/";
const textures = [
  "rocket-v101/62fa36daba8d4650a7528a37fb5ef493_RGB_Rocket_BaseColor.png",
  "rocket-v101/99c9b04ac5a34aeabedf27a242aa129b_N_Rocket_Normal.png",
  "rocket-v101/192c9a0e123d48fd93009c8d25cbbf60_R_Rocket_Roughtness.png",
  "rocket/b9aad02784134191a2fa13abf67fbffc_RGB_Fire_BaseColor.png",
  "star/5a1d0233fae744c88291995dba892e20_R_Star_Roughtness.png",
  "meteor/453cc9e80cc6423d94f70f926703fb81_RGB_Meteor_BaseColor.png",
  "meteor/6abdd65aa5194c89bbadbf454cf89e52_N_Meteor_Normal.png",
  "meteor/9f1683fc59c34728a4462508f8e385bb_R_Meteor_Roughtness.png",
].map((path) => root + path);

/** Clone before assigning materials; useLoader's cached originals remain untouched. */
export function useSpaceModels() {
  const rocket = useLoader(GLTFLoader, root + "rocket-v101/Rocket.glb");
  const sources = useLoader(OBJLoader, [
    root + "star/8d8d7c521b43427a99e6df007004564a.obj",
    root + "meteor/60136dbdd0434b48a763385058f651f7.obj",
  ]);
  const sourceMaps = useLoader(THREE.TextureLoader, textures);
  const prepared = useMemo(() => {
    const maps = sourceMaps.map((texture) => {
      const map = texture.clone();
      // Supplied OBJ UVs use negative V coordinates: repeat instead of clamping
      // every texel to the border. Keep TextureLoader flipY for OBJ convention.
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.needsUpdate = true;
      return map;
    });
    // Color maps are sRGB; normal and roughness maps remain linear data.
    [0, 3, 5].forEach((i) => { maps[i].colorSpace = THREE.SRGBColorSpace; });
    const hull = new THREE.MeshPhysicalMaterial({
      map: maps[0], normalMap: maps[1], roughnessMap: maps[2],
      metalness: 0.05, roughness: 1, clearcoat: 0.12, envMapIntensity: 0.45,
      clearcoatRoughness: 0.2, normalScale: new THREE.Vector2(0.5, 0.5),
    });
    const flame = new THREE.MeshStandardMaterial({
      map: maps[3], emissiveMap: maps[3], emissive: "#ffac48", emissiveIntensity: 3,
      roughness: 1, toneMapped: false,
    });
    const gold = new THREE.MeshStandardMaterial({
      // The supplied star color PNG is entirely black; use the reference's gold.
      color: "#ffd05a", roughnessMap: maps[4], metalness: 0.4, roughness: 0.4,
      emissive: "#ffb52e", emissiveIntensity: 0.85,
    });
    const rock = new THREE.MeshStandardMaterial({
      map: maps[5], normalMap: maps[6], roughnessMap: maps[7], roughness: 1, metalness: 0.08,
    });
    const models = [rocket.scene, ...sources].map((source, index) => {
      const clone = source.clone(true);
      if (index === 0) {
        // The supplied mesh has a baked diagonal longitudinal axis. Align its
        // measured principal axis with screen-up before centering/scaling.
        clone.quaternion.setFromUnitVectors(new THREE.Vector3(-0.36537422, 0.78477997, 0.5006217).normalize(), new THREE.Vector3(0, 1, 0));
      }
      clone.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        // The supplied OBJ incorrectly labels BOTH groups as Fire. Mesh names
        // retain the correct identity, so the body gets its own PBR textures.
        child.material = index === 0 ? (child.name.startsWith("Fire_") ? flame : hull) : index === 1 ? gold : rock;
      });
      const box = new THREE.Box3().setFromObject(clone);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      clone.position.sub(center);
      const group = new THREE.Group();
      group.add(clone);
      group.scale.setScalar((index === 0 ? 1.85 : 1) / Math.max(size.x, size.y, size.z));
      return group;
    });
    return { rocket: models[0], star: models[1], meteor: models[2], materials: [hull, flame, gold, rock], maps };
  }, [rocket, sources, sourceMaps]);
  useEffect(() => () => {
    prepared.materials.forEach((material) => material.dispose());
    prepared.maps.forEach((texture) => texture.dispose());
  }, [prepared]);
  return prepared;
}
