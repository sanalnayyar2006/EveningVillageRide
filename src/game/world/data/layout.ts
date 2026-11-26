// The village layout, traced from the satellite screenshot in RULES/map/.
// Positions are screenshot pixels converted with px() (see mapSource.ts).
// North is -Z; the highway runs across the south, the village climbs the slope to the north.
// Rendering, physics and gameplay all read from here.

import { mulberry32 } from "@/utils/math";
import { headingTowards, nearestOnPolyline } from "./geometry";
import { MAP_BOUNDS, px, pxLength, pxPath, type Point } from "./mapSource";

export const WORLD = {
  /** The bike stays inside this rectangle: the screenshot minus a small margin. */
  rideBounds: {
    minX: MAP_BOUNDS.minX + 6,
    maxX: MAP_BOUNDS.maxX - 6,
    minZ: MAP_BOUNDS.minZ + 6,
    maxZ: MAP_BOUNDS.maxZ - 6,
  },
  /** Terrain mesh half-size; beyond the map it rises into wooded hills. */
  extent: 330,
} as const;

/** The whole village sits on a hillside that climbs gently to the north. */
export const SLOPE = {
  /** Metres of rise per metre travelled north (3.5%: noticeable, never tiring). */
  grade: 0.035,
  /** Height of each terrace step inside the fields. */
  terraceStep: 0.9,
} as const;

/** Spawn on the highway east of the village, riding west towards the village gate. */
export const SPAWN = (() => {
  const [x, z] = px(930, 748);
  const [tx, tz] = px(880, 736);
  return { x, z, heading: headingTowards(x, z, tx, tz) };
})();

// ---------------------------------------------------------------------------
// Roads

export type RoadSurface = "asphalt" | "dirt";

export interface Road {
  name: string;
  points: Point[];
  width: number;
  surface: RoadSurface;
}

const road = (name: string, width: number, surface: RoadSurface, path: Point[]): Road => ({
  name,
  width,
  surface,
  points: pxPath(path),
});

export const ROADS: Road[] = [
  // NH154 runs right across the map; both ends leave it.
  road("highway", 15, "asphalt", [
    [-40, 600],
    [100, 598],
    [300, 620],
    [500, 650],
    [700, 692],
    [900, 740],
    [1130, 790],
  ]),
  road("south-west branch", 7, "asphalt", [
    [110, 603],
    [60, 630],
    [0, 662],
    [-40, 682],
  ]),
  // The main village road, from the gate on the highway up the hill to the north edge.
  road("village road", 5.5, "asphalt", [
    [705, 690],
    [707, 600],
    [690, 545],
    [655, 485],
    [628, 425],
    [622, 360],
    [605, 290],
    [590, 220],
    [588, 150],
    [600, 105],
    [680, 95],
    [760, 70],
    [810, 35],
    [850, -40],
  ]),
  // Across the top of the village, past the hospital, to the north-west houses.
  road("upper lane", 4, "dirt", [
    [588, 165],
    [540, 178],
    [470, 182],
    [400, 172],
    [330, 176],
    [262, 192],
    [200, 216],
    [150, 252],
    [100, 300],
    [60, 342],
    [-40, 390],
  ]),
  road("north-west lane", 3.5, "dirt", [
    [240, 194],
    [200, 152],
    [150, 132],
    [100, 112],
    [40, 92],
    [-40, 80],
  ]),
  // Down the west side, past the cricket ground, to the highway.
  road("cricket path", 3, "dirt", [
    [258, 194],
    [250, 262],
    [242, 332],
    [240, 402],
    [244, 470],
    [238, 530],
    [228, 590],
  ]),
  road("east lane", 4, "dirt", [
    [775, 80],
    [790, 170],
    [800, 250],
    [810, 330],
    [802, 420],
    [782, 500],
    [762, 560],
    [750, 625],
    [745, 705],
  ]),
  road("east cluster lane", 3.5, "dirt", [
    [980, 762],
    [976, 690],
    [972, 610],
    [962, 540],
    [935, 470],
    [890, 438],
    [806, 405],
  ]),
  road("south lane", 3.5, "dirt", [
    [440, 664],
    [432, 740],
    [422, 795],
    [440, 850],
    [470, 940],
  ]),
  road("south-east lane", 3.5, "dirt", [
    [692, 702],
    [700, 780],
    [740, 850],
    [780, 940],
  ]),
];

export interface RoadHit {
  /** Distance to the road edge in metres; negative means on the road. */
  edge: number;
  /** Closest point on that road's centre line. */
  x: number;
  z: number;
}

/** The nearest road to (x, z). */
export function nearestRoad(x: number, z: number): RoadHit {
  const best: RoadHit = { edge: Infinity, x: 0, z: 0 };
  for (const r of ROADS) {
    const near = nearestOnPolyline(x, z, r.points);
    const edge = near.distance - r.width / 2;
    if (edge < best.edge) Object.assign(best, { edge, x: near.x, z: near.z });
  }
  return best;
}

// ---------------------------------------------------------------------------
// Water

/** The dry stream bed (khad) in the south-west, below the substation. */
export const STREAM = {
  points: pxPath([
    [-40, 690],
    [40, 720],
    [100, 763],
    [150, 823],
    [210, 848],
    [280, 888],
    [330, 960],
  ]),
  /** Half-width of the trickle of water. */
  waterHalfWidth: 2.2,
  /** Half-width of the stony bed including its banks. */
  bedHalfWidth: 6.5,
  depth: 1.4,
} as const;

/**
 * The Kangra Valley narrow-gauge railway really runs about 1.5 km south of the
 * village. It's brought in to just beyond the south edge of the map, so the
 * evening train can be seen and heard from the village.
 */
export const RAILWAY = {
  z: MAP_BOUNDS.maxZ + 40,
  /** Half-width of the levelled bed the track sits on. */
  bedHalfWidth: 3.5,
  /** The line runs east–west across the whole terrain. */
  halfLength: 330,
} as const;

/** A village pond where the satellite shows a green, wet patch. */
export const POND = (() => {
  const [x, z] = px(872, 628);
  return { x, z, radius: 7.5, depth: 1.25 };
})();

// ---------------------------------------------------------------------------
// Fields

export type FieldUse = "wheat" | "mustard" | "paddy" | "fallow" | "orchard";

export interface Field {
  id: string;
  polygon: Point[];
  use: FieldUse;
}

const field = (id: string, use: FieldUse, outline: Point[]): Field => ({
  id,
  use,
  polygon: pxPath(outline),
});

export const FIELDS: Field[] = [
  field("hospital terraces", "fallow", [
    [288, 242],
    [492, 234],
    [497, 300],
    [468, 372],
    [288, 366],
  ]),
  field("middle terraces", "wheat", [
    [398, 408],
    [572, 412],
    [576, 498],
    [402, 504],
  ]),
  field("north-east mustard", "mustard", [
    [814, 12],
    [902, 12],
    [902, 158],
    [814, 150],
  ]),
  field("north-east fallow", "fallow", [
    [918, 42],
    [998, 34],
    [1002, 138],
    [922, 148],
  ]),
  field("east orchard", "orchard", [
    [852, 240],
    [1080, 236],
    [1080, 298],
    [852, 300],
  ]),
  field("lane orchard", "orchard", [
    [818, 422],
    [906, 418],
    [910, 506],
    [820, 508],
  ]),
  field("pond paddy", "paddy", [
    [822, 516],
    [908, 520],
    [904, 596],
    [826, 596],
  ]),
];

/** Fields with crops are cut into terrace steps; orchards keep the natural slope. */
export const isTerraced = (f: Field) => f.use !== "orchard";

// ---------------------------------------------------------------------------
// Houses

export interface HouseSpec {
  x: number;
  z: number;
  /** Radians; the house front (+z local) faces the nearest road. */
  rot: number;
  w: number;
  d: number;
  h: number;
  wall: string;
  trim: string;
  roof: "flat" | "tile";
  floors?: 1 | 2;
}

/** Traced roof outlines: [u, v, width px, depth px]. */
const TRACED_HOUSES: [number, number, number, number][] = [
  // North-west cluster.
  [60, 20, 30, 30],
  [112, 42, 30, 28],
  [160, 30, 26, 24],
  [205, 40, 26, 26],
  [250, 15, 26, 24],
  [118, 92, 38, 28],
  [172, 104, 30, 30],
  [30, 85, 26, 24],
  [88, 140, 26, 24],
  [128, 208, 34, 28],
  [76, 226, 30, 28],
  [138, 264, 30, 28],
  [80, 276, 26, 24],
  [228, 266, 24, 28],
  [276, 296, 28, 24],
  [62, 334, 38, 28],
  [150, 345, 30, 24],
  [30, 370, 28, 28],
  [82, 384, 26, 24],
  [150, 376, 28, 24],
  [40, 414, 26, 24],
  [130, 430, 24, 24],
  [172, 454, 24, 24],
  [30, 460, 28, 28],
  [62, 514, 28, 28],
  [20, 524, 24, 24],
  // Around the hospital and up the village road.
  [500, 92, 24, 24],
  [512, 128, 24, 24],
  [542, 42, 30, 30],
  [452, 98, 24, 22],
  [622, 136, 26, 24],
  [642, 178, 30, 28],
  [672, 122, 30, 24],
  [702, 50, 30, 24],
  [726, 120, 24, 28],
  [762, 30, 24, 24],
  [742, 160, 24, 24],
  [766, 196, 30, 24],
  [836, 194, 34, 28],
  [744, 222, 24, 24],
  [762, 268, 30, 28],
  [838, 278, 28, 28],
  [748, 300, 24, 24],
  [776, 316, 30, 24],
  [748, 350, 30, 24],
  [682, 376, 30, 24],
  [652, 368, 24, 24],
  [664, 426, 30, 28],
  [694, 416, 24, 24],
  [556, 216, 24, 24],
  // North-east.
  [1022, 178, 24, 38],
  [1052, 182, 30, 28],
  [962, 172, 24, 24],
  [1062, 92, 30, 24],
  [1002, 166, 24, 24],
  // East cluster.
  [935, 500, 28, 28],
  [1002, 507, 28, 28],
  [1035, 522, 28, 28],
  [1000, 557, 28, 28],
  [1042, 565, 28, 24],
  [920, 584, 28, 28],
  [940, 538, 26, 24],
  [1022, 607, 32, 28],
  [934, 644, 28, 28],
  [1012, 662, 32, 28],
  [1060, 642, 24, 28],
  [1062, 694, 28, 24],
  // Between the village road and the east lane.
  [730, 574, 26, 24],
  [776, 590, 24, 24],
  [728, 628, 26, 26],
  [784, 646, 28, 28],
  [830, 668, 26, 24],
  // Shops and houses on the north side of the highway.
  [292, 562, 28, 38],
  [324, 568, 26, 38],
  [358, 572, 24, 32],
  [398, 566, 28, 32],
  [454, 580, 24, 28],
  [602, 604, 28, 40],
  // South of the highway.
  [460, 718, 28, 24],
  [500, 730, 28, 20],
  [534, 724, 34, 28],
  [470, 762, 28, 24],
  [508, 768, 36, 24],
  [574, 730, 24, 28],
  [616, 736, 36, 28],
  [652, 742, 24, 24],
  [664, 776, 28, 28],
  [584, 794, 24, 24],
  [614, 806, 28, 24],
  [470, 820, 56, 34],
  [500, 852, 28, 24],
  [782, 794, 28, 24],
  [824, 806, 28, 24],
  [864, 796, 28, 28],
  [952, 806, 28, 28],
  [1002, 796, 28, 24],
  [1044, 826, 28, 28],
  [632, 884, 28, 24],
  [704, 886, 28, 28],
  [790, 866, 28, 24],
  [864, 864, 28, 28],
  [1000, 882, 28, 24],
  [560, 882, 26, 24],
];

const WALLS = [
  "#f3ece0",
  "#efe2c4",
  "#e9c46a",
  "#a9d6cf",
  "#f2d0a4",
  "#e8a1a1",
  "#9ec5e8",
  "#f6efe3",
  "#d7e3a3",
  "#c8a2d6",
];
const TRIMS = ["#7a4e2d", "#f6eee2", "#2f7f8f", "#9c4a2f", "#c0392b", "#6b3f22"];
/** Keep this much ground between a house wall and the road edge. */
const ROAD_CLEARANCE = 1.5;

/**
 * Turns a traced outline into a house: real size, a colour scheme, and a
 * front facing the nearest road. A house traced a little too close to a road
 * is nudged back so its walls never stand on the tarmac.
 */
function houseFromTrace([u, v, wPx, dPx]: [number, number, number, number], i: number): HouseSpec {
  const random = mulberry32(i * 7 + 3);
  // Roof outlines include eaves and courtyards, so the walls are a bit smaller.
  const w = Math.min(14, Math.max(6, pxLength(wPx) * 0.85));
  const d = Math.min(12, Math.max(5.5, pxLength(dPx) * 0.85));
  let [x, z] = px(u, v);

  const road = nearestRoad(x, z);
  const needed = Math.max(w, d) / 2 + ROAD_CLEARANCE;
  if (road.edge < needed) {
    const away = Math.hypot(x - road.x, z - road.z) || 1;
    const push = needed - road.edge;
    x += ((x - road.x) / away) * push;
    z += ((z - road.z) / away) * push;
  }

  return {
    x,
    z,
    rot: headingTowards(x, z, road.x, road.z),
    w,
    d,
    h: 2.9 + random() * 0.4,
    wall: WALLS[Math.floor(random() * WALLS.length)]!,
    trim: TRIMS[Math.floor(random() * TRIMS.length)]!,
    roof: random() < 0.65 ? "flat" : "tile",
    floors: random() < 0.4 ? 2 : 1,
  };
}

export const HOUSES: HouseSpec[] = TRACED_HOUSES.map(houseFromTrace);
