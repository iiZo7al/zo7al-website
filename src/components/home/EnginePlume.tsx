"use client";
import { useReducedMotion } from "framer-motion";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function EnginePlume({ paused }: { paused: boolean }) {
  const reduced = useReducedMotion();
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  useFrame((_, delta) => { if (!paused && !reduced && material.current) material.current.uniforms.time.value += Math.min(delta, 0.05); });
  return <group position={[0, -0.78, 0]}>
    <mesh position={[0, -0.67, 0]}>
      <cylinderGeometry args={[0.14, 0.012, 1.35, 24, 12, true]} />
      <shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide}
        vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
        fragmentShader={`uniform float time; varying vec2 vUv;
        void main(){float tail=1.0-vUv.y; float flicker=0.85+0.15*sin(vUv.y*34.0-time*18.0+sin(vUv.x*24.0));
        float fade=(1.0-smoothstep(0.1,1.0,tail)); vec3 hot=mix(vec3(1.0,0.22,0.025),vec3(0.15,0.55,1.0),vUv.y);
        hot=mix(hot,vec3(1.0,0.96,0.8),pow(vUv.y,7.0)); gl_FragColor=vec4(hot,fade*flicker*0.85);}`}/>
    </mesh>
    <mesh position={[0, -0.22, 0]}><sphereGeometry args={[0.085, 12, 8]} /><meshBasicMaterial color="#fff0d0" toneMapped={false} transparent opacity={0.9} /></mesh>
    <pointLight color="#ff993d" intensity={2.5} distance={3} decay={2} />
  </group>;
}
