import { mulberry32 } from "@/utils/math";
import { roadEdgeDistance, isInWater } from "../terrain";
import { FIELDS, HOUSES, POND, RAILWAY, WORLD } from "./layout";
import {
  BANYAN,
  BUS_STOP,
  CRICKET_PITCH,
  HAYSTACKS,
  MARKET_STALLS,
  SCHOOL,
  TEA_STALL,
  TEMPLE,
  WATER_TANK,
  WELL,
} from "./structures";

export type TreeKind = "round" | "palm" | "tall";

export interface TreeSpec {
  x: number;
  z: number;
  kind: TreeKind;
  scale: number;
  rot: number;
  /** 0..1 colour variation. */
  tint: number;
}

/** Areas kept clear of random trees. [x, z, radius] */
const CLEARINGS: [number, number, number][] = [
  ...HOUSES.map((h): [number, number, number] => [h.x, h.z, Math.max(h.w, h.d) * 0.75 + 2]),
  [BANYAN.x, BANYAN.z, BANYAN.canopyRadius],
  [WELL.x, WELL.z, 3],
  [TEA_STALL.x, TEA_STALL.z, 7],
  [BUS_STOP.x, BUS_STOP.z, 5],
  [TEMPLE.x, TEMPLE.z, 12],
  [TEMPLE.x, -31, 4],
  [SCHOOL.x, SCHOOL.z, 12],
  [CRICKET_PITCH.x, CRICKET_PITCH.z, 14],
  [WATER_TANK.x, WATER_TANK.z, 5],
  [POND.x, POND.z, POND.radius + 3],
  [30, 0, 18],
  ...HAYSTACKS.map((h): [number, number, number] => [h.x, h.z, h.r + 2]),
  ...MARKET_STALLS.map((s): [number, number, number] => [s.x, s.z, 4]),
];

const inField = (x: number, z: number, pad = 0) =>
  FIELDS.some(
    (f) => x > f.min[0] - pad && x < f.max[0] + pad && z > f.min[1] - pad && z < f.max[1] + pad,
  );

const inClearing = (x: number, z: number) =>
  CLEARINGS.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r);

const nearRail = (x: number, pad: number) => Math.abs(x - RAILWAY.x) < pad;

function scatterTrees(): TreeSpec[] {
  const rand = mulberry32(1987);
  const trees: TreeSpec[] = [];
  const tooClose = (x: number, z: number, min: number) =>
    trees.some((t) => Math.hypot(t.x - x, t.z - z) < min);

  const place = (x: number, z: number, kind: TreeKind, spacing: number) => {
    if (roadEdgeDistance(x, z) < 2.2 || isInWater(x, z) || inField(x, z, 1.5)) return false;
    if (inClearing(x, z) || nearRail(x, 6) || tooClose(x, z, spacing)) return false;
    trees.push({ x, z, kind, scale: 0.8 + rand() * 0.55, rot: rand() * Math.PI * 2, tint: rand() });
    return true;
  };

  // Coconut palms ringing the pond.
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const r = POND.radius + 3.2 + rand() * 1.5;
    place(POND.x + Math.cos(a) * r, POND.z + Math.sin(a) * r, "palm", 2.5);
  }

  // Village trees inside the rideable area.
  let attempts = 0;
  let placed = 0;
  while (placed < 230 && attempts < 6000) {
    attempts++;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (WORLD.rideRadius + 2);
    const roll = rand();
    const kind: TreeKind = roll < 0.62 ? "round" : roll < 0.82 ? "tall" : "palm";
    if (place(Math.cos(a) * r, Math.sin(a) * r, kind, 5.5)) placed++;
  }

  // Denser forest ring on the hills; purely visual.
  attempts = 0;
  placed = 0;
  while (placed < 260 && attempts < 4000) {
    attempts++;
    const a = rand() * Math.PI * 2;
    const r = WORLD.rideRadius + 6 + rand() * 80;
    const kind: TreeKind = rand() < 0.75 ? "round" : "tall";
    if (place(Math.cos(a) * r, Math.sin(a) * r, kind, 6)) placed++;
  }
  return trees;
}

export const TREES = scatterTrees();

export interface TuftSpec {
  x: number;
  z: number;
  scale: number;
  rot: number;
}

function scatterTufts(count: number, seed: number, maxRadius: number): TuftSpec[] {
  const rand = mulberry32(seed);
  const out: TuftSpec[] = [];
  let attempts = 0;
  while (out.length < count && attempts < count * 6) {
    attempts++;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * maxRadius;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (roadEdgeDistance(x, z) < 0.6 || isInWater(x, z) || inField(x, z)) continue;
    if (inClearing(x, z) && rand() > 0.25) continue;
    out.push({ x, z, scale: 0.6 + rand() * 0.8, rot: rand() * Math.PI * 2 });
  }
  return out;
}

export const GRASS_TUFTS = scatterTufts(2400, 42, 150);

/** Flower clusters gather around the pond, the banyan and the temple. */
export const FLOWERS: (TuftSpec & { color: number })[] = (() => {
  const rand = mulberry32(7);
  const centres: [number, number, number][] = [
    [POND.x, POND.z, POND.radius + 7],
    [BANYAN.x, BANYAN.z, 10],
    [TEMPLE.x, TEMPLE.z + 8, 7],
    [SCHOOL.x - 6, SCHOOL.z - 6, 6],
  ];
  const out: (TuftSpec & { color: number })[] = [];
  for (const [cx, cz, radius] of centres) {
    for (let i = 0; i < 90; i++) {
      const a = rand() * Math.PI * 2;
      const r = radius * (0.35 + rand() * 0.65);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      if (roadEdgeDistance(x, z) < 0.5 || isInWater(x, z)) continue;
      out.push({
        x,
        z,
        scale: 0.7 + rand() * 0.6,
        rot: rand() * 6.28,
        color: Math.floor(rand() * 4),
      });
    }
  }
  return out;
})();

/** Centres the butterflies hover around. */
export const FLOWER_PATCHES: [number, number][] = [
  [POND.x + 8, POND.z - 8],
  [BANYAN.x + 6, BANYAN.z - 4],
  [TEMPLE.x + 4, TEMPLE.z + 9],
  [SCHOOL.x - 6, SCHOOL.z - 7],
];
