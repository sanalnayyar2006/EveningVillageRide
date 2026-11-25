import type { GeometryBatch } from "../batch";
import {
  CROSS_ROAD_LAMPS,
  POLE_HEIGHT,
  POWER_POLES,
  STREET_LAMPS,
  WIRE_OFFSETS,
} from "../data/props";
import { BENCHES, HAND_PUMP, WELL } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "./place";

function bench(b: GeometryBatch) {
  b.box([1.7, 0.07, 0.45], [0, 0.45, 0], PALETTE.wood);
  b.box([1.7, 0.35, 0.05], [0, 0.72, -0.21], PALETTE.wood, [-0.15, 0, 0]);
  for (const x of [-0.75, 0.75]) {
    b.box([0.07, 0.45, 0.4], [x, 0.225, 0], PALETTE.darkWood);
  }
}

function well(b: GeometryBatch) {
  b.cylinder(WELL.radius, WELL.radius + 0.1, 0.85, [0, 0.42, 0], PALETTE.stone, 18);
  b.cylinder(WELL.radius + 0.04, WELL.radius + 0.04, 0.1, [0, 0.88, 0], PALETTE.whitewash, 18);
  b.cylinder(WELL.radius - 0.2, WELL.radius - 0.2, 0.02, [0, 0.8, 0], "#1d2a2a", 18);
  for (const x of [-WELL.radius, WELL.radius]) b.box([0.14, 1.9, 0.14], [x, 1.3, 0], PALETTE.wood);
  b.beam([-WELL.radius, 2.2, 0], [WELL.radius, 2.2, 0], 0.1, PALETTE.wood);
  b.cylinder(0.12, 0.12, 0.12, [0, 2.2, 0], PALETTE.iron, 10, [0, 0, Math.PI / 2]);
  b.cylinder(0.12, 0.09, 0.22, [0.5, 1.02, 0.4], PALETTE.tin, 10);
}

function handPump(b: GeometryBatch) {
  b.box([0.8, 0.12, 0.8], [0, 0.06, 0], PALETTE.stone);
  b.cylinder(0.09, 0.11, 0.95, [0, 0.55, 0], "#3b5f78", 10);
  b.cylinder(0.04, 0.04, 0.35, [0.18, 0.75, 0], "#3b5f78", 6, [0, 0, Math.PI / 2 + 0.35]);
  b.beam([0, 1.05, 0], [-0.7, 1.25, 0], 0.05, "#3b5f78");
}

/** A street lamp whose arm reaches `reach` metres along local +X. */
function streetLamp(b: GeometryBatch, reach: number) {
  b.cylinder(0.06, 0.09, 4.4, [0, 2.2, 0], PALETTE.iron, 8);
  b.beam([0, 4.2, 0], [reach, 4.35, 0], 0.06, PALETTE.iron);
  b.box([0.35, 0.12, 0.25], [reach, 4.32, 0], PALETTE.iron);
  b.glowing(() => b.sphere(0.12, [reach, 4.2, 0], "#ffffff"));
}

function powerPole(b: GeometryBatch) {
  b.box([0.22, POLE_HEIGHT, 0.22], [0, POLE_HEIGHT / 2, 0], "#b7b0a2");
  b.box([1.4, 0.1, 0.12], [0, POLE_HEIGHT - 0.3, 0], PALETTE.iron);
  for (const x of WIRE_OFFSETS)
    b.cylinder(0.04, 0.05, 0.12, [x, POLE_HEIGHT - 0.2, 0], "#e8e2d4", 6);
}

export function buildProps(b: GeometryBatch) {
  for (const spot of BENCHES) onGround(b, spot.x, spot.z, spot.rot, () => bench(b));
  onGround(b, WELL.x, WELL.z, 0.3, () => well(b));
  onGround(b, HAND_PUMP.x, HAND_PUMP.z, 0.8, () => handPump(b));

  for (const [x, z, side] of STREET_LAMPS) onGround(b, x, z, 0, () => streetLamp(b, side * 1.1));
  for (const [x, z] of CROSS_ROAD_LAMPS) {
    // Arm points across the road: towards +Z for lamps on the north side, -Z for the south.
    onGround(b, x, z, z < 0 ? -Math.PI / 2 : Math.PI / 2, () => streetLamp(b, 1.1));
  }
  // The crossbar runs east–west, across the road.
  for (const [x, z] of POWER_POLES) onGround(b, x, z, 0, () => powerPole(b));
}
