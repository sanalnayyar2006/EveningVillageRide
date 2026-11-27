import { heightAt } from "../terrain";
import { headingTowards, localToWorld, nearestOnPolyline } from "./geometry";
import { ROADS, nearestRoad } from "./layout";
import { px } from "./mapSource";
import type { Placement } from "./structures";

const HIGHWAY = ROADS.find((r) => r.name === "highway")!;
const VILLAGE_ROAD = ROADS.find((r) => r.name === "village road")!;

/** A lamp at a traced spot, its arm reaching towards the nearest road. */
function lampAt(u: number, v: number): Placement {
  const [x, z] = px(u, v);
  const road = nearestRoad(x, z);
  return { x, z, rot: headingTowards(x, z, road.x, road.z) };
}

/** Street lamps along the bazaar, at the junction and up the village road. */
export const STREET_LAMPS: Placement[] = [
  lampAt(380, 650),
  lampAt(470, 664),
  lampAt(560, 676),
  lampAt(650, 660),
  lampAt(720, 640),
  lampAt(694, 560),
  lampAt(664, 498),
  lampAt(614, 400),
  lampAt(606, 300),
  lampAt(578, 200),
];

export const POLE_HEIGHT = 7;
/** Sideways offsets of the three wires along each pole's crossbar. */
export const WIRE_OFFSETS = [-0.55, 0, 0.55];
/** How far a wire droops at the middle of a span (m). */
const WIRE_SAG = 0.7;
/** Distance between poles, and how far they stand from the highway's centre line. */
const POLE_SPACING = 32;
const POLE_SETBACK = 11;

/**
 * Electricity poles marching along the north side of the highway. Each
 * crossbar is turned across the line, so the wires run straight from pole to pole.
 */
export const POWER_POLES: Placement[] = (() => {
  const poles: Placement[] = [];
  let travelled = 0;
  for (let i = 0; i < HIGHWAY.points.length - 1; i++) {
    const [ax, az] = HIGHWAY.points[i]!;
    const [bx, bz] = HIGHWAY.points[i + 1]!;
    const length = Math.hypot(bx - ax, bz - az);
    const dirX = (bx - ax) / length;
    const dirZ = (bz - az) / length;
    for (
      let d = (POLE_SPACING - (travelled % POLE_SPACING)) % POLE_SPACING;
      d < length;
      d += POLE_SPACING
    ) {
      // The road's left normal points north for a road heading east.
      const x = ax + dirX * d + dirZ * POLE_SETBACK;
      const z = az + dirZ * d - dirX * POLE_SETBACK;
      poles.push({ x, z, rot: Math.atan2(dirX, dirZ) });
    }
    travelled += length;
  }
  // Skip any pole that would land on the village road where it meets the highway.
  return poles.filter((p) => nearestOnPolyline(p.x, p.z, VILLAGE_ROAD.points).distance > 5);
})();

/**
 * A point on the wire hanging between two neighbouring poles: `offset` picks
 * the wire along the crossbar, `t` runs 0..1 from pole `a` to pole `b`.
 */
export function wirePoint(
  a: Placement,
  b: Placement,
  offset: number,
  t: number,
): [number, number, number] {
  const [ax, az] = localToWorld(a.x, a.z, a.rot, offset, 0);
  const [bx, bz] = localToWorld(b.x, b.z, b.rot, offset, 0);
  const ay = heightAt(a.x, a.z) + POLE_HEIGHT - 0.15;
  const by = heightAt(b.x, b.z) + POLE_HEIGHT - 0.15;
  return [ax + (bx - ax) * t, ay + (by - ay) * t - 4 * WIRE_SAG * t * (1 - t), az + (bz - az) * t];
}
