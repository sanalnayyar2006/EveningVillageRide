/**
 * Placement of hand-built landmark pieces, in screenshot pixels like the rest
 * of the map. Visual builders and physics colliders both read these, so they
 * can never drift apart. `rot` turns a piece so its front (+Z local) faces
 * that way; most face the nearest road.
 */

import { headingTowards, localToWorld } from "./geometry";
import { nearestRoad } from "./layout";
import { px, pxLength, type Point } from "./mapSource";

export interface Placement {
  x: number;
  z: number;
  rot: number;
}

/** A spot from the screenshot, turned to face the nearest road. */
function facingRoad(u: number, v: number): Placement {
  const [x, z] = px(u, v);
  const road = nearestRoad(x, z);
  return { x, z, rot: headingTowards(x, z, road.x, road.z) };
}

/** A spot from the screenshot with a fixed facing (0 = south, π = north). */
function at(u: number, v: number, rot: number): Placement {
  const [x, z] = px(u, v);
  return { x, z, rot };
}

/** Welcome arch where the village road leaves the highway; it faces riders arriving from the south. */
export const GATE = { ...at(706, 652, 0), halfSpan: 4.4, pillar: 0.9, height: 5.4 } as const;
export const BUS_STOP = { ...facingRoad(560, 632), length: 4.4, depth: 2.2, height: 2.6 } as const;

export const BANYAN = {
  ...at(612, 522, 0),
  platformRadius: 4.3,
  platformHeight: 0.5,
  trunkRadius: 1.3,
  canopyRadius: 13,
} as const;
export const BENCHES = [
  { id: "banyanBench", ...facingRoad(636, 512) },
  { id: "pondBench", ...facingRoad(846, 612) },
  { id: "teaBench", ...facingRoad(672, 664) },
] as const;
export const HAND_PUMP = at(752, 608, 0.8);
export const WELL = { ...at(900, 660, 0.3), radius: 1.3 } as const;

export const TEA_STALL = { ...facingRoad(684, 648), w: 3.6, d: 2.6, h: 2.5 } as const;
/** The evening bazaar on the south verge of the highway. */
export const MARKET_STALLS = [
  { ...facingRoad(400, 662), canopy: "#e76f51" },
  { ...facingRoad(470, 673), canopy: "#f4a261" },
  { ...facingRoad(502, 677), canopy: "#2a9d8f" },
  { ...facingRoad(534, 682), canopy: "#e9c46a" },
  { ...facingRoad(566, 687), canopy: "#d62f6a" },
] as const;
export const STALL_SIZE = { w: 3.4, d: 2.2 } as const;

/** On the slope above the upper lane; the bell arch spans the lane in front of it. */
export const TEMPLE = {
  ...at(420, 140, 0),
  plinth: { w: 11, d: 11, h: 0.7 },
  sanctum: { w: 4.6, d: 4.6, h: 3.6 },
  spireHeight: 7.5,
} as const;
export const TEMPLE_BELL = { ...at(420, 140 + 28, 0), height: 3.4 } as const;

export const SCHOOL = { ...facingRoad(96, 566), w: 16, d: 6.5, h: 3.6 } as const;
export const CRICKET_PITCH = { ...at(195, 505, Math.PI / 2), length: 16 } as const;
export const WATER_TANK = {
  ...at(1000, 452, 0),
  legSpread: 2.2,
  tankHeight: 11,
  tankRadius: 3,
} as const;

/** Sri Sai Hospital, as labelled on the map: a two-storey clinic on the upper lane. */
export const HOSPITAL = { ...facingRoad(512, 212), w: 10, d: 12, floorHeight: 3.3 } as const;

/** The 220 kV substation south of the highway: a fenced yard of gantries and transformers. */
export const SUBSTATION = {
  ...at(270, 733, -0.068),
  w: pxLength(210),
  d: pxLength(195),
  /** Control building, in the yard's local space. */
  building: { x: -27, z: -26, w: 20, d: 13, h: 5 },
} as const;
/** The yard's corners, for ground colour and fence colliders. */
export const SUBSTATION_YARD: Point[] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
].map(([sx, sz]) =>
  localToWorld(
    SUBSTATION.x,
    SUBSTATION.z,
    SUBSTATION.rot,
    (sx! * SUBSTATION.w) / 2,
    (sz! * SUBSTATION.d) / 2,
  ),
);

export const HAYSTACKS = [
  { ...at(480, 388, 0), r: 2.1 },
  { ...at(300, 384, 0), r: 1.7 },
  { ...at(930, 166, 0), r: 2 },
  { ...at(806, 168, 0), r: 1.8 },
] as const;
export const BULLOCK_CART = at(510, 392, 0.6);
export const SCARECROWS = [at(858, 80, 0), at(488, 455, 0.8)] as const;
