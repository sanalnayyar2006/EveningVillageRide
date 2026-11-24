"use client";

import { CapsuleCollider, RigidBody } from "@react-three/rapier";

export const PLAYER_SPAWN: [number, number, number] = [0, 3, 0];

/**
 * Stand-in for the rider until Phase 1. It spawns in the air and falls onto
 * the ground, which proves the physics world is stepping.
 */
export function PlayerPlaceholder() {
  return (
    <RigidBody colliders={false} position={PLAYER_SPAWN} enabledRotations={[false, false, false]}>
      <CapsuleCollider args={[0.5, 0.35]} />
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 1, 6, 16]} />
        <meshStandardMaterial color="#d9663b" roughness={0.6} />
      </mesh>
      {/* Facing marker so orientation is obvious. */}
      <mesh position={[0, 0.45, 0.3]} castShadow>
        <boxGeometry args={[0.2, 0.12, 0.15]} />
        <meshStandardMaterial color="#fff1dc" />
      </mesh>
    </RigidBody>
  );
}
