"use client";

import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { BODY_TAGS } from "@/game/core/physicsTags";
import { OBSTACLES, type Obstacle } from "./data/obstacles";
import { heightAt } from "./terrain";

function ObstacleCollider({ obstacle }: { obstacle: Obstacle }) {
  const y = heightAt(obstacle.x, obstacle.z) + obstacle.h / 2;
  if (obstacle.kind === "box") {
    return (
      <CuboidCollider
        args={[obstacle.hx, obstacle.h / 2, obstacle.hz]}
        position={[obstacle.x, y, obstacle.z]}
        rotation={[0, obstacle.rot, 0]}
      />
    );
  }
  return (
    <CylinderCollider args={[obstacle.h / 2, obstacle.r]} position={[obstacle.x, y, obstacle.z]} />
  );
}

/**
 * Every solid thing in the village as Rapier colliders, generated from the
 * same OBSTACLES data the scenery is placed from.
 */
export function StaticColliders() {
  const visible = OBSTACLES.filter((o) => !o.invisible);
  const invisible = OBSTACLES.filter((o) => o.invisible);
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {visible.map((obstacle, i) => (
          <ObstacleCollider key={i} obstacle={obstacle} />
        ))}
      </RigidBody>
      <RigidBody type="fixed" colliders={false} userData={{ tag: BODY_TAGS.invisibleBlocker }}>
        {invisible.map((obstacle, i) => (
          <ObstacleCollider key={i} obstacle={obstacle} />
        ))}
      </RigidBody>
    </>
  );
}
