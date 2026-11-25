import { smoothstep } from "@/utils/math";
import {
  BRIDGE,
  POND,
  RAILWAY,
  RIVER,
  ROADS,
  WORLD,
  riverMeander,
  type RoadSegment,
} from "./data/layout";

/** Cheap smooth noise from summed sines, for rolling hills. Roughly -1..1. */
const hillNoise = (x: number, z: number) =>
  0.5 * Math.sin(x * 0.021 + 1.7) * Math.cos(z * 0.017 - 0.4) +
  0.3 * Math.sin(x * 0.047 - z * 0.031 + 2.1) +
  0.2 * Math.cos(x * 0.09 + z * 0.083);

/** The bridge deck arches up in the middle so riding over it feels like something. */
const bridgeDeckHeight = (z: number) => {
  const t = (z - BRIDGE.z) / BRIDGE.halfLength;
  return 0.06 + BRIDGE.rise * Math.cos((t * Math.PI) / 2);
};

export const isOnBridge = (x: number, z: number) =>
  Math.abs(x - BRIDGE.x) <= BRIDGE.halfWidth && Math.abs(z - BRIDGE.z) <= BRIDGE.halfLength;

export const riverCenterZ = (x: number) => RIVER.z + riverMeander(x);

/** Ground height at any point. The single source of truth for "where is the floor". */
export function heightAt(x: number, z: number): number {
  if (isOnBridge(x, z)) return bridgeDeckHeight(z);

  // Flat village, rising into hills towards the edge of the map.
  const fromCentre = Math.hypot(x, z);
  let height = smoothstep(WORLD.flatRadius, 175, fromCentre) * (11 + 9 * hillNoise(x, z));

  const fromRiver = Math.abs(z - riverCenterZ(x));
  height -= RIVER.depth * (1 - smoothstep(RIVER.halfWidth - 1, RIVER.bankHalfWidth, fromRiver));

  const fromPond = Math.hypot(x - POND.x, z - POND.z);
  height -= 1.25 * (1 - smoothstep(POND.radius - 2, POND.radius + 2.2, fromPond));

  // Low embankment under the railway.
  const fromRail = Math.abs(x - RAILWAY.x);
  height += 0.22 * (1 - smoothstep(2.2, 4, fromRail));

  return height;
}

/** Uphill angle (radians) when facing `heading` at a point; negative going downhill. */
export function slopeAt(x: number, z: number, heading: number): number {
  const reach = 0.6;
  const dx = Math.sin(heading) * reach;
  const dz = Math.cos(heading) * reach;
  return Math.atan2(heightAt(x + dx, z + dz) - heightAt(x - dx, z - dz), reach * 2);
}

export function distanceToSegment(x: number, z: number, segment: RoadSegment): number {
  const [ax, az] = segment.from;
  const [bx, bz] = segment.to;
  const abx = bx - ax;
  const abz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(x - (ax + abx * t), z - (az + abz * t));
}

/** Distance to the nearest road edge in metres; negative means on a road. */
export function roadEdgeDistance(x: number, z: number): number {
  let nearest = Infinity;
  for (const road of ROADS)
    nearest = Math.min(nearest, distanceToSegment(x, z, road) - road.width / 2);
  if (isOnBridge(x, z)) nearest = Math.min(nearest, -1);
  return nearest;
}

export const isInWater = (x: number, z: number) =>
  (!isOnBridge(x, z) && Math.abs(z - riverCenterZ(x)) < RIVER.halfWidth + 0.5) ||
  Math.hypot(x - POND.x, z - POND.z) < POND.radius + 0.5;
