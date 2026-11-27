"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { ambient } from "@/game/ambient/ambientState";
import { POND, STREAM } from "./data/layout";
import { POND_WATER_Y, streamWaterY } from "./terrain";
import { waterUniforms } from "./waterShader";
import { WORLD_MATERIALS } from "./worldMaterials";

/** The water reaches a little under the banks so no gap shows at the edge. */
const OVERLAP = 1.2;
/** Sample spacing along the stream, so the water steps down the hill smoothly. */
const STEP = 3;

/** A ribbon of water along the stream's course, dropping with the hillside. */
function buildStream(): BufferGeometry {
  const positions: number[] = [];
  const half = STREAM.waterHalfWidth + OVERLAP * 0.5;
  const points = STREAM.points;

  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i]!;
    const [bx, bz] = points[i + 1]!;
    const length = Math.hypot(bx - ax, bz - az);
    const sideX = (-(bz - az) / length) * half;
    const sideZ = ((bx - ax) / length) * half;
    const steps = Math.ceil(length / STEP);
    for (let s = 0; s < steps; s++) {
      const x0 = ax + ((bx - ax) * s) / steps;
      const z0 = az + ((bz - az) * s) / steps;
      const x1 = ax + ((bx - ax) * (s + 1)) / steps;
      const z1 = az + ((bz - az) * (s + 1)) / steps;
      const y0 = streamWaterY(x0, z0);
      const y1 = streamWaterY(x1, z1);
      const left0 = [x0 - sideX, y0, z0 - sideZ];
      const right0 = [x0 + sideX, y0, z0 + sideZ];
      const left1 = [x1 - sideX, y1, z1 - sideZ];
      const right1 = [x1 + sideX, y1, z1 + sideZ];
      positions.push(...left0, ...right0, ...right1, ...left0, ...right1, ...left1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Stream and pond surfaces, rippling and mirroring the evening sky (see waterShader). */
export function Water() {
  const stream = useMemo(() => buildStream(), []);
  useFrame(() => {
    waterUniforms.uWaterTime.value = ambient.time;
  });
  return (
    <>
      <mesh geometry={stream} material={WORLD_MATERIALS.water} />
      <mesh
        position={[POND.x, POND_WATER_Y, POND.z]}
        rotation-x={-Math.PI / 2}
        material={WORLD_MATERIALS.water}
      >
        <circleGeometry args={[POND.radius + OVERLAP, 40]} />
      </mesh>
    </>
  );
}
