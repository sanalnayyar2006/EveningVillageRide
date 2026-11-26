"use client";

import { useFrame } from "@react-three/fiber";
import { CylinderCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { BODY_TAGS } from "@/game/core/physicsTags";
import { FRAME_ORDER } from "@/game/core/frameOrder";
import { heightAt } from "@/game/world/terrain";

interface Positioned {
  x: number;
  z: number;
}

interface CreatureBodiesProps {
  creatures: readonly Positioned[];
  radius: number;
  halfHeight: number;
}

/**
 * A kinematic cylinder following each creature, so the bike bumps into
 * people and animals instead of riding through them.
 */
export function CreatureBodies({ creatures, radius, halfHeight }: CreatureBodiesProps) {
  const bodies = useRef<(RapierRigidBody | null)[]>([]);

  // Right after the creatures move, before the bike checks for collisions.
  useFrame(() => {
    creatures.forEach((c, i) => {
      bodies.current[i]?.setNextKinematicTranslation({
        x: c.x,
        y: heightAt(c.x, c.z) + halfHeight,
        z: c.z,
      });
    });
  }, FRAME_ORDER.life + 1);

  return (
    <>
      {creatures.map((c, i) => (
        <RigidBody
          key={i}
          ref={(body) => {
            bodies.current[i] = body;
          }}
          type="kinematicPosition"
          colliders={false}
          position={[c.x, heightAt(c.x, c.z) + halfHeight, c.z]}
          userData={{ tag: BODY_TAGS.creature }}
        >
          <CylinderCollider args={[halfHeight, radius]} />
        </RigidBody>
      ))}
    </>
  );
}
