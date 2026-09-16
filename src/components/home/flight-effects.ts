import * as THREE from "three";

export interface FlightBurst { object: THREE.Group; life: number; duration: number; velocities: Float32Array }
export function makeBurst(position: THREE.Vector3, impact: boolean, reduced: boolean): FlightBurst {
  const object = new THREE.Group(); object.position.copy(position);
  const count = reduced ? 10 : impact ? 70 : 20;
  const vertices = new Float32Array(count * 3), velocities = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    direction.multiplyScalar((impact ? 5 : 2) * (0.4 + Math.random()));
    velocities.set(direction.toArray(), i * 3);
    const color = new THREE.Color(i % 3 ? "#ff8528" : "#fff3ce"); colors.set(color.toArray(), i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  object.add(new THREE.Points(geometry, new THREE.PointsMaterial({ vertexColors: true, size: impact ? 0.15 : 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  if (impact && !reduced) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.83, 48), new THREE.MeshBasicMaterial({ color: "#ffad57", transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.name = "shockwave"; object.add(ring);
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: "#fff4d4", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    flash.name = "impact-core"; object.add(flash);
    for (let i = 0; i < 8; i++) {
      const shard = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + Math.random() * 0.07, 0), new THREE.MeshStandardMaterial({ color: "#502518", emissive: "#ff6824", emissiveIntensity: 1.5, roughness: 0.8, transparent: true }));
      shard.name = "debris";
      shard.userData.velocity = new THREE.Vector3(velocities[i * 3], velocities[i * 3 + 1], velocities[i * 3 + 2]);
      object.add(shard);
    }
  }
  return { object, life: impact ? 0.8 : 0.45, duration: impact ? 0.8 : 0.45, velocities };
}
export function disposeBurst(burst: FlightBurst) {
  burst.object.removeFromParent();
  burst.object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points) { child.geometry.dispose(); (child.material as THREE.Material).dispose(); }
  });
}
export function stepBurst(burst: FlightBurst, dt: number) {
  burst.life -= dt;
  if (burst.life <= 0) { disposeBurst(burst); return false; }
  const progress = 1 - burst.life / burst.duration;
  burst.object.children.forEach((child) => {
    if (child instanceof THREE.Points) {
      const positions = child.geometry.getAttribute("position");
      for (let i = 0; i < positions.count; i++) positions.setXYZ(i, positions.getX(i) + burst.velocities[i * 3] * dt, positions.getY(i) + burst.velocities[i * 3 + 1] * dt, positions.getZ(i) + burst.velocities[i * 3 + 2] * dt);
      positions.needsUpdate = true; (child.material as THREE.PointsMaterial).opacity = 1 - progress;
    } else if (child instanceof THREE.Mesh) {
      if (child.name === "debris") {
        child.position.addScaledVector(child.userData.velocity as THREE.Vector3, dt);
        child.rotation.x += dt * 4; child.rotation.z += dt * 3;
        (child.material as THREE.MeshStandardMaterial).opacity = 1 - progress;
        return;
      }
      child.scale.setScalar(child.name === "shockwave" ? 0.25 + progress * 4 : 1 + progress * 3);
      (child.material as THREE.MeshBasicMaterial).opacity = child.name === "shockwave" ? (1 - progress) * 0.6 : Math.max(0, 1 - progress * 4) * 0.7;
    }
  });
  return true;
}
