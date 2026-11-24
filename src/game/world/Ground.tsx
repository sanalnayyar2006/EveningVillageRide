"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";

const SIZE = 1200;

/** Flat placeholder ground. Phase 2 replaces it with the village terrain. */
export function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[SIZE / 2, 0.5, SIZE / 2]} position={[0, -0.5, 0]} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial color="#93a04f" roughness={0.95} />
      </mesh>
    </RigidBody>
  );
}
