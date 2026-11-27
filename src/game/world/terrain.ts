import { smoothstep } from "@/utils/math";
import { boundsOf, inBounds, inPolygon, nearestOnPolyline } from "./data/geometry";
import { FIELDS, POND, RAILWAY, SLOPE, STREAM, isTerraced, nearestRoad } from "./data/layout";
import { MAP_BOUNDS } from "./data/mapSource";

/** Cheap smooth noise from summed sines. Roughly -1..1. */
const noise = (x: number, z: number) =>
  0.5 * Math.sin(x * 0.021 + 1.7) * Math.cos(z * 0.017 - 0.4) +
  0.3 * Math.sin(x * 0.047 - z * 0.031 + 2.1) +
  0.2 * Math.cos(x * 0.09 + z * 0.083);

/** The hillside: rising to the north, with wooded hills beyond the edge of the map. */
function hillside(x: number, z: number): number {
  const beyondMap = Math.max(
    MAP_BOUNDS.minX - x,
    x - MAP_BOUNDS.maxX,
    MAP_BOUNDS.minZ - z,
    z - MAP_BOUNDS.maxZ,
    0,
  );
  return -z * SLOPE.grade + smoothstep(0, 90, beyondMap) * (14 + 9 * noise(x, z));
}

/** Natural ground: the hillside plus small bumps. */
const naturalGround = (x: number, z: number) => hillside(x, z) + 0.45 * noise(x * 1.7, z * 1.7);

const TERRACED = FIELDS.filter(isTerraced).map((f) => ({
  polygon: f.polygon,
  bounds: boundsOf(f.polygon),
}));
const STREAM_BOUNDS = boundsOf(STREAM.points, STREAM.bedHalfWidth + 2);

const inTerracedField = (x: number, z: number) =>
  TERRACED.some((f) => inBounds(x, z, f.bounds) && inPolygon(x, z, f.polygon));

/** Flat steps with a short riser between them, like hillside terraces. */
function terrace(height: number): number {
  const step = SLOPE.terraceStep;
  const level = Math.floor(height / step);
  return step * (level + smoothstep(0.82, 1, height / step - level));
}

/** Horizontal distance from the stream's centre line (Infinity when far away). */
function streamDistance(x: number, z: number): number {
  if (!inBounds(x, z, STREAM_BOUNDS)) return Infinity;
  return nearestOnPolyline(x, z, STREAM.points).distance;
}

/** The pond sits in a level hollow, so its water line is the same all round. */
const POND_LEVEL = naturalGround(POND.x, POND.z);
export const POND_WATER_Y = POND_LEVEL - POND.depth + 0.8;

/** Ground height at any point. The single source of truth for "where is the floor". */
export function heightAt(x: number, z: number): number {
  let height = inTerracedField(x, z) ? terrace(hillside(x, z)) : naturalGround(x, z);

  // Roads are graded: level across, following the hillside along their length.
  const road = nearestRoad(x, z);
  if (road.edge < 3) {
    const roadHeight = hillside(road.x, road.z);
    height += (roadHeight - height) * (1 - smoothstep(0, 3, road.edge));
  }

  const fromPond = Math.hypot(x - POND.x, z - POND.z);
  if (fromPond < POND.radius + 6) {
    height += (POND_LEVEL - height) * (1 - smoothstep(POND.radius + 2, POND.radius + 6, fromPond));
    height -= POND.depth * (1 - smoothstep(POND.radius - 2, POND.radius + 2.2, fromPond));
  }

  const fromRail = Math.abs(z - RAILWAY.z);
  if (fromRail < RAILWAY.bedHalfWidth + 4) {
    const bed = 1 - smoothstep(RAILWAY.bedHalfWidth, RAILWAY.bedHalfWidth + 4, fromRail);
    height += (railHeight(x) - 0.25 - height) * bed;
  }

  const fromStream = streamDistance(x, z);
  if (fromStream < STREAM.bedHalfWidth + 2) {
    // Smooth the banks first, so the bed has an even depth under the water.
    const bank = 1 - smoothstep(STREAM.bedHalfWidth - 1, STREAM.bedHalfWidth + 2, fromStream);
    height += (hillside(x, z) - height) * bank;
    height -=
      STREAM.depth * (1 - smoothstep(STREAM.waterHalfWidth - 1, STREAM.bedHalfWidth, fromStream));
  }
  return height;
}

/** Height of the railway bed: the hillside along the line, without its bumps. */
export const railHeight = (x: number) => hillside(x, RAILWAY.z) + 0.25;

/** Water surface height of the stream at a point on (or near) its centre line. */
export const streamWaterY = (x: number, z: number) => hillside(x, z) - STREAM.depth + 0.35;

/** Uphill angle (radians) when facing `heading` at a point; negative going downhill. */
export function slopeAt(x: number, z: number, heading: number): number {
  const reach = 0.6;
  const dx = Math.sin(heading) * reach;
  const dz = Math.cos(heading) * reach;
  return Math.atan2(heightAt(x + dx, z + dz) - heightAt(x - dx, z - dz), reach * 2);
}

/** Distance to the nearest road edge in metres; negative means on a road. */
export const roadEdgeDistance = (x: number, z: number) => nearestRoad(x, z).edge;

export const isInWater = (x: number, z: number) =>
  streamDistance(x, z) < STREAM.waterHalfWidth + 0.5 ||
  Math.hypot(x - POND.x, z - POND.z) < POND.radius + 0.5;
