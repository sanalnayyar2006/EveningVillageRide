"use client";

import { useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { POND, RIVER, WORLD } from "./data/layout";
import { riverCenterZ } from "./terrain";
import { WORLD_MATERIALS } from "./worldMaterials";

/** The water reaches a little under the banks so no gap shows at the edge. */
const OVERLAP = 1.2;

/** A flat ribbon that follows the river's bends across the whole map. */
function buildRiver(): BufferGeometry {
  const positions: number[] = [];
  const half = RIVER.halfWidth + OVERLAP;
  const step = 4;
  for (let x = -WORLD.extent; x < WORLD.extent; x += step) {
    const z0 = riverCenterZ(x);
    const z1 = riverCenterZ(x + step);
    const y = RIVER.waterY;
    positions.push(x, y, z0 - half, x, y, z0 + half, x + step, y, z1 + half);
    positions.push(x, y, z0 - half, x + step, y, z1 + half, x + step, y, z1 - half);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** River and pond surfaces. Flat for now; Phase 5 adds movement and reflections. */
export function Water() {
  const river = useMemo(() => buildRiver(), []);
  return (
    <>
      <mesh geometry={river} material={WORLD_MATERIALS.water} />
      <mesh
        position={[POND.x, POND.waterY, POND.z]}
        rotation-x={-Math.PI / 2}
        material={WORLD_MATERIALS.water}
      >
        <circleGeometry args={[POND.radius + OVERLAP, 40]} />
      </mesh>
    </>
  );
}
