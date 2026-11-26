import type { useRapier } from "@react-three/rapier";
import type { Vector3 } from "three";
import { CAMERA_IGNORED_TAGS } from "@/game/core/physicsTags";

export type RapierWorld = ReturnType<typeof useRapier>["world"];
export type RapierRay = InstanceType<ReturnType<typeof useRapier>["rapier"]["Ray"]>;

/**
 * Distance along `direction` to the first collider the camera can't see
 * through, or null if nothing is hit within `maxDistance`. `direction` must be
 * normalised. The bike and invisible blockers are ignored.
 */
export function castCameraRay(
  world: RapierWorld,
  ray: RapierRay,
  from: Vector3,
  direction: Vector3,
  maxDistance: number,
): number | null {
  ray.origin = { x: from.x, y: from.y, z: from.z };
  ray.dir = { x: direction.x, y: direction.y, z: direction.z };
  const hit = world.castRay(
    ray,
    maxDistance,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    (collider) => {
      const tag = (collider.parent()?.userData as { tag?: string } | undefined)?.tag;
      return !collider.isSensor() && !(tag && CAMERA_IGNORED_TAGS.has(tag));
    },
  );
  return hit ? hit.timeOfImpact : null;
}
