"use client";

import { useMemo } from "react";
import { BufferAttribute, Color, PlaneGeometry } from "three";
import { smoothstep } from "@/utils/math";
import { FIELDS, WORLD } from "./data/layout";
import { heightAt, roadEdgeDistance } from "./terrain";
import { WORLD_MATERIALS } from "./worldMaterials";

/** Vertex spacing is extent * 2 / SEGMENTS ≈ 2 m. */
const SEGMENTS = 260;

const GROUND = {
  grass: new Color("#93a04c"),
  dryGrass: new Color("#b3a85f"),
  hillGrass: new Color("#6f7f3b"),
  wornEarth: new Color("#a88e5f"),
  fieldSoil: new Color("#7d5c3b"),
  sand: new Color("#c4a97c"),
  riverBed: new Color("#6d5c47"),
};

const inField = (x: number, z: number) =>
  FIELDS.some((f) => x > f.min[0] && x < f.max[0] && z > f.min[1] && z < f.max[1]);

/** Pick the ground colour for a point: grass by default, with earth, sand and soil where they belong. */
function groundColor(x: number, z: number, height: number, out: Color): Color {
  const patchiness = 0.5 + 0.5 * Math.sin(x * 0.11) * Math.cos(z * 0.09 + 1.3);
  out.copy(GROUND.grass).lerp(GROUND.dryGrass, patchiness * 0.6);
  out.lerp(GROUND.hillGrass, smoothstep(1, 12, height));

  if (inField(x, z)) out.lerp(GROUND.fieldSoil, 0.85);

  // Worn earth fades out over the first 2 m beside every road.
  out.lerp(GROUND.wornEarth, 1 - smoothstep(-0.5, 2, roadEdgeDistance(x, z)));

  if (height < -0.15) out.lerp(GROUND.sand, smoothstep(-0.15, -0.5, height));
  if (height < -0.8) out.lerp(GROUND.riverBed, smoothstep(-0.8, -1.3, height));
  return out;
}

/** The village ground: one mesh shaped by heightAt() and coloured per vertex. */
export function TerrainMesh() {
  const geometry = useMemo(() => {
    const size = WORLD.extent * 2;
    const plane = new PlaneGeometry(size, size, SEGMENTS, SEGMENTS);
    plane.rotateX(-Math.PI / 2);

    const positions = plane.getAttribute("position");
    const colors = new Float32Array(positions.count * 3);
    const color = new Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = heightAt(x, z);
      positions.setY(i, height);
      groundColor(x, z, height, color).toArray(colors, i * 3);
    }
    plane.setAttribute("color", new BufferAttribute(colors, 3));
    plane.computeVertexNormals();
    return plane;
  }, []);

  return <mesh geometry={geometry} material={WORLD_MATERIALS.painted} receiveShadow />;
}
