import type { Point } from "./mapSource";

export interface NearestPoint {
  /** Distance from the query point to the polyline. */
  distance: number;
  /** The closest point on the polyline. */
  x: number;
  z: number;
  /** Direction of the polyline there, as a unit vector. */
  dirX: number;
  dirZ: number;
}

/** Closest point on a polyline to (x, z). */
export function nearestOnPolyline(x: number, z: number, points: readonly Point[]): NearestPoint {
  const best: NearestPoint = { distance: Infinity, x: 0, z: 0, dirX: 1, dirZ: 0 };
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i]!;
    const [bx, bz] = points[i + 1]!;
    const abx = bx - ax;
    const abz = bz - az;
    const lengthSq = abx * abx + abz * abz;
    if (lengthSq === 0) continue;
    const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / lengthSq));
    const cx = ax + abx * t;
    const cz = az + abz * t;
    const distance = Math.hypot(x - cx, z - cz);
    if (distance < best.distance) {
      const length = Math.sqrt(lengthSq);
      Object.assign(best, { distance, x: cx, z: cz, dirX: abx / length, dirZ: abz / length });
    }
  }
  return best;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function boundsOf(points: readonly Point[], pad = 0): Bounds {
  const xs = points.map(([x]) => x);
  const zs = points.map(([, z]) => z);
  return {
    minX: Math.min(...xs) - pad,
    maxX: Math.max(...xs) + pad,
    minZ: Math.min(...zs) - pad,
    maxZ: Math.max(...zs) + pad,
  };
}

export const inBounds = (x: number, z: number, b: Bounds) =>
  x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;

/** Even-odd rule: is (x, z) inside the polygon? */
export function inPolygon(x: number, z: number, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i]!;
    const [xj, zj] = polygon[j]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Heading (radians, same convention as the bike) that looks from a towards b. */
export const headingTowards = (ax: number, az: number, bx: number, bz: number) =>
  Math.atan2(bx - ax, bz - az);

/** Rotate a local offset by `rotationY` and add it to (x, z). */
export function localToWorld(
  x: number,
  z: number,
  rotationY: number,
  localX: number,
  localZ: number,
): Point {
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  return [x + localX * cos + localZ * sin, z - localX * sin + localZ * cos];
}
