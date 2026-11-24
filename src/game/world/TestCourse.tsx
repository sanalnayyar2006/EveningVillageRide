"use client";

import { RigidBody } from "@react-three/rapier";

/**
 * Phase 1 placeholder: obstacles for testing collisions and the camera's
 * clipping avoidance. Removed when the village arrives in Phase 2.
 */
const CRATES: [number, number, number][] = [
  [4, 0.5, -14],
  [-6, 0.5, -20],
  [-5, 0.5, -21.2],
  [10, 0.5, -26],
];
const PILLARS: [number, number][] = [
  [-12, -32],
  [12, -38],
  [0, -48],
];

export function TestCourse() {
  return (
    <>
      {/* Dirt loop to ride around. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, -35]} receiveShadow>
        <ringGeometry args={[23, 27, 96]} />
        <meshStandardMaterial color="#b98d5c" roughness={1} />
      </mesh>

      {CRATES.map((p, i) => (
        <RigidBody key={`crate-${i}`} type="fixed" colliders="cuboid" position={p}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#a0703f" roughness={0.8} />
          </mesh>
        </RigidBody>
      ))}

      {PILLARS.map(([x, z], i) => (
        <RigidBody key={`pillar-${i}`} type="fixed" colliders="hull" position={[x, 2, z]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.6, 0.7, 4, 16]} />
            <meshStandardMaterial color="#e8dcc4" roughness={0.7} />
          </mesh>
        </RigidBody>
      ))}

      {/* A wall with a gap: ride through it and back the camera against it. */}
      {[-9, 9].map((x) => (
        <RigidBody key={`wall-${x}`} type="fixed" colliders="cuboid" position={[x, 1.25, -62]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[14, 2.5, 0.6]} />
            <meshStandardMaterial color="#d9a066" roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
