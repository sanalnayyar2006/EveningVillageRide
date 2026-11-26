import { mulberry32 } from "@/utils/math";
import { isInWater, roadEdgeDistance } from "../terrain";
import { CANOPY_PX } from "./canopy.generated";
import { boundsOf, inBounds, inPolygon } from "./geometry";
import { FIELDS, HOUSES, POND, RAILWAY, WORLD } from "./layout";
import { MAP_BOUNDS, px } from "./mapSource";
import {
  BANYAN,
  BUS_STOP,
  CRICKET_PITCH,
  HAYSTACKS,
  HOSPITAL,
  MARKET_STALLS,
  SCHOOL,
  SUBSTATION_YARD,
  TEA_STALL,
  TEMPLE,
  TEMPLE_BELL,
  WATER_TANK,
  WELL,
} from "./structures";

export type TreeKind = "round" | "tall";

export interface TreeSpec {
  x: number;
  z: number;
  kind: TreeKind;
  scale: number;
  rot: number;
  /** 0..1 colour variation. */
  tint: number;
}

/** Areas kept clear of trees and most grass. [x, z, radius] */
const CLEARINGS: [number, number, number][] = [
  ...HOUSES.map((h): [number, number, number] => [h.x, h.z, Math.max(h.w, h.d) * 0.7 + 1.5]),
  [BANYAN.x, BANYAN.z, BANYAN.canopyRadius],
  [WELL.x, WELL.z, 3],
  [TEA_STALL.x, TEA_STALL.z, 6],
  [BUS_STOP.x, BUS_STOP.z, 5],
  [TEMPLE.x, TEMPLE.z, 10],
  [TEMPLE_BELL.x, TEMPLE_BELL.z, 3],
  [SCHOOL.x, SCHOOL.z, 12],
  [CRICKET_PITCH.x, CRICKET_PITCH.z, 16],
  [WATER_TANK.x, WATER_TANK.z, 5],
  [HOSPITAL.x, HOSPITAL.z, 10],
  [POND.x, POND.z, POND.radius + 3],
  ...HAYSTACKS.map((h): [number, number, number] => [h.x, h.z, h.r + 2]),
  ...MARKET_STALLS.map((s): [number, number, number] => [s.x, s.z, 4]),
];

const FIELD_AREAS = FIELDS.map((f) => ({ ...f, bounds: boundsOf(f.polygon) }));
const fieldAt = (x: number, z: number) =>
  FIELD_AREAS.find((f) => inBounds(x, z, f.bounds) && inPolygon(x, z, f.polygon));

const inClearing = (x: number, z: number) =>
  CLEARINGS.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r);

/** Ground where nothing should grow: roads, water, the substation yard, buildings. */
const isBare = (x: number, z: number, roadMargin: number) =>
  roadEdgeDistance(x, z) < roadMargin ||
  isInWater(x, z) ||
  inPolygon(x, z, SUBSTATION_YARD) ||
  Math.abs(z - RAILWAY.z) < RAILWAY.bedHalfWidth + 3 ||
  inClearing(x, z);

/** Spacing between village trees; the canopy data has a candidate every ~2 m. */
const TREE_SPACING = 6;
const ORCHARD_SPACING = 7;
const FOREST_SPACING = 8;

/** A grid of occupied cells, so "is there a tree nearby?" stays fast with thousands of trees. */
class SpacingGrid {
  private cells = new Map<string, [number, number][]>();
  constructor(private size: number) {}

  private key(x: number, z: number) {
    return `${Math.floor(x / this.size)},${Math.floor(z / this.size)}`;
  }

  isFree(x: number, z: number, spacing: number): boolean {
    const cx = Math.floor(x / this.size);
    const cz = Math.floor(z / this.size);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (const [tx, tz] of this.cells.get(`${cx + dx},${cz + dz}`) ?? []) {
          if (Math.hypot(tx - x, tz - z) < spacing) return false;
        }
      }
    }
    return true;
  }

  add(x: number, z: number) {
    const key = this.key(x, z);
    const list = this.cells.get(key) ?? [];
    list.push([x, z]);
    this.cells.set(key, list);
  }
}

function scatterTrees(): TreeSpec[] {
  const rand = mulberry32(1987);
  const trees: TreeSpec[] = [];
  const grid = new SpacingGrid(FOREST_SPACING);
  const add = (x: number, z: number, kind: TreeKind, scale: number) => {
    grid.add(x, z);
    trees.push({ x, z, kind, scale, rot: rand() * Math.PI * 2, tint: rand() });
  };

  // Orchards: fruit trees in neat rows.
  for (const orchard of FIELD_AREAS.filter((f) => f.use === "orchard")) {
    const { minX, maxX, minZ, maxZ } = orchard.bounds;
    for (let x = minX + 3; x < maxX - 2; x += ORCHARD_SPACING) {
      for (let z = minZ + 3; z < maxZ - 2; z += ORCHARD_SPACING) {
        if (!inPolygon(x, z, orchard.polygon) || isBare(x, z, 2)) continue;
        add(x, z, "round", 0.55 + rand() * 0.15);
      }
    }
  }

  // Village trees exactly where the satellite shows canopy, thinned to a natural spacing.
  const candidates = [...CANOPY_PX];
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
  }
  for (const [u, v] of candidates) {
    const [x, z] = px(u, v);
    if (fieldAt(x, z) || isBare(x, z, 2.5) || !grid.isFree(x, z, TREE_SPACING)) continue;
    add(x, z, rand() < 0.78 ? "round" : "tall", 0.9 + rand() * 0.6);
  }

  // Wooded hills beyond the edge of the map; purely visual.
  let attempts = 0;
  let placed = 0;
  while (placed < 420 && attempts < 6000) {
    attempts++;
    const x = (rand() * 2 - 1) * (WORLD.extent - 20);
    const z = (rand() * 2 - 1) * (WORLD.extent - 20);
    const beyond = Math.max(
      MAP_BOUNDS.minX - x,
      x - MAP_BOUNDS.maxX,
      MAP_BOUNDS.minZ - z,
      z - MAP_BOUNDS.maxZ,
    );
    if (beyond < 4 || beyond > 110 || isBare(x, z, 2.5) || !grid.isFree(x, z, FOREST_SPACING)) {
      continue;
    }
    add(x, z, rand() < 0.6 ? "tall" : "round", 1 + rand() * 0.5);
    placed++;
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

function scatterTufts(count: number, seed: number): TuftSpec[] {
  const rand = mulberry32(seed);
  const { minX, maxX, minZ, maxZ } = WORLD.rideBounds;
  const out: TuftSpec[] = [];
  let attempts = 0;
  while (out.length < count && attempts < count * 6) {
    attempts++;
    const x = minX - 20 + rand() * (maxX - minX + 40);
    const z = minZ - 20 + rand() * (maxZ - minZ + 40);
    if (roadEdgeDistance(x, z) < 0.6 || isInWater(x, z) || inPolygon(x, z, SUBSTATION_YARD)) {
      continue;
    }
    const field = fieldAt(x, z);
    if (field && field.use !== "orchard") continue;
    if (inClearing(x, z) && rand() > 0.25) continue;
    out.push({ x, z, scale: 0.6 + rand() * 0.8, rot: rand() * Math.PI * 2 });
  }
  return out;
}

export const GRASS_TUFTS = scatterTufts(3600, 42);

/** Centres where flowers gather, and where the butterflies will hover. */
export const FLOWER_PATCHES: [number, number][] = [
  [POND.x - 9, POND.z - 4],
  [BANYAN.x + 7, BANYAN.z + 5],
  [TEMPLE.x + 6, TEMPLE.z + 6],
  [SCHOOL.x + 8, SCHOOL.z - 4],
];

export const FLOWERS: (TuftSpec & { color: number })[] = (() => {
  const rand = mulberry32(7);
  const out: (TuftSpec & { color: number })[] = [];
  for (const [cx, cz] of FLOWER_PATCHES) {
    for (let i = 0; i < 90; i++) {
      const a = rand() * Math.PI * 2;
      const r = 7 * (0.35 + rand() * 0.65);
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
