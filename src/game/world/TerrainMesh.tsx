"use client";

import { useMemo } from "react";
import { BufferAttribute, Color, PlaneGeometry } from "three";
import { smoothstep } from "@/utils/math";
import { boundsOf, inBounds, inPolygon, nearestOnPolyline } from "./data/geometry";
import { FIELDS, POND, STREAM, WORLD, type FieldUse } from "./data/layout";
import { SUBSTATION_YARD } from "./data/structures";
import { heightAt, roadEdgeDistance } from "./terrain";
import { WORLD_MATERIALS } from "./worldMaterials";

/** Vertex spacing is extent * 2 / SEGMENTS ≈ 2.5 m. */
const SEGMENTS = 264;

const GROUND = {
  grass: new Color("#93a04c"),
  dryGrass: new Color("#b3a85f"),
  hillGrass: new Color("#5f7234"),
  wornEarth: new Color("#a88e5f"),
  fieldSoil: new Color("#8a6a45"),
  paddy: new Color("#6f8f3e"),
  orchard: new Color("#7f8f42"),
  gravel: new Color("#9a948a"),
  sand: new Color("#c4b08c"),
  streamBed: new Color("#a39a8a"),
};

const FIELD_COLOURS: Record<FieldUse, Color> = {
  wheat: GROUND.fieldSoil,
  mustard: GROUND.fieldSoil,
  fallow: GROUND.fieldSoil,
  paddy: GROUND.paddy,
  orchard: GROUND.orchard,
};

const FIELD_AREAS = FIELDS.map((f) => ({ ...f, bounds: boundsOf(f.polygon) }));
const fieldAt = (x: number, z: number) =>
  FIELD_AREAS.find((f) => inBounds(x, z, f.bounds) && inPolygon(x, z, f.polygon));

const STREAM_AREA = boundsOf(STREAM.points, STREAM.bedHalfWidth + 3);

/** Pick the ground colour for a point: grass by default, with soil, earth and stone where they belong. */
function groundColor(x: number, z: number, out: Color): Color {
  const patchiness = 0.5 + 0.5 * Math.sin(x * 0.11) * Math.cos(z * 0.09 + 1.3);
  out.copy(GROUND.grass).lerp(GROUND.dryGrass, patchiness * 0.6);

  // Off the map the ground turns into darker, wooded hillside.
  const { minX, maxX, minZ, maxZ } = WORLD.rideBounds;
  const beyond = Math.max(minX - x, x - maxX, minZ - z, z - maxZ, 0);
  out.lerp(GROUND.hillGrass, smoothstep(0, 40, beyond));

  const field = fieldAt(x, z);
  if (field) out.lerp(FIELD_COLOURS[field.use], 0.85);
  if (inPolygon(x, z, SUBSTATION_YARD)) out.lerp(GROUND.gravel, 0.9);

  // Worn earth fades out over the first 2 m beside every road.
  out.lerp(GROUND.wornEarth, 1 - smoothstep(-0.5, 2, roadEdgeDistance(x, z)));

  if (inBounds(x, z, STREAM_AREA)) {
    const fromStream = nearestOnPolyline(x, z, STREAM.points).distance;
    out.lerp(
      GROUND.streamBed,
      1 - smoothstep(STREAM.bedHalfWidth - 1.5, STREAM.bedHalfWidth + 1.5, fromStream),
    );
  }
  const fromPond = Math.hypot(x - POND.x, z - POND.z);
  out.lerp(GROUND.sand, 1 - smoothstep(POND.radius, POND.radius + 2.5, fromPond));
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
      groundColor(x, z, color).toArray(colors, i * 3);
    }
    plane.setAttribute("color", new BufferAttribute(colors, 3));
    plane.computeVertexNormals();
    return plane;
  }, []);

  return <mesh geometry={geometry} material={WORLD_MATERIALS.painted} receiveShadow />;
}
