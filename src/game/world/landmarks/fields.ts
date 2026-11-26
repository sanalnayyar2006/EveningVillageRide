import { mulberry32 } from "@/utils/math";
import type { GeometryBatch } from "../batch";
import { FIELDS } from "../data/layout";
import { BULLOCK_CART, HAYSTACKS, SCARECROWS } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import type { Point } from "../data/mapSource";
import { heightAt, isInWater, roadEdgeDistance } from "../terrain";
import { onGround } from "../scenery/place";

/** Length of one stretch of wall; short enough to follow the ground. */
const WALL_STEP = 2.4;

/** Dry-stone walls along the field edges, haystacks, scarecrows and a resting bullock cart. Crops are in Crops.tsx. */
export function buildFields(b: GeometryBatch) {
  for (const field of FIELDS) buildWall(b, field.polygon);

  for (const stack of HAYSTACKS) {
    onGround(b, stack.x, stack.z, 0, () => {
      b.cylinder(stack.r, stack.r * 1.05, 1.3, [0, 0.65, 0], PALETTE.hay, 14);
      b.cone(stack.r * 1.08, 1.6, [0, 2.1, 0], "#cfa84e", 14);
      b.cylinder(0.04, 0.04, 0.6, [0, 3, 0], PALETTE.wood, 4);
    });
  }

  for (const [i, scarecrow] of SCARECROWS.entries()) {
    onGround(b, scarecrow.x, scarecrow.z, i * 0.8, () => {
      b.cylinder(0.04, 0.05, 2.2, [0, 1.1, 0], PALETTE.wood, 5);
      b.beam([-0.7, 1.55, 0], [0.7, 1.55, 0], 0.05, PALETTE.wood);
      b.box([0.6, 0.7, 0.25], [0, 1.4, 0], i === 0 ? "#a9442d" : "#3f6a8a");
      b.sphere(0.2, [0, 2.0, 0], PALETTE.terracotta);
      b.cone(0.32, 0.25, [0, 2.24, 0], PALETTE.hay, 10);
    });
  }

  buildBullockCart(b);
}

/** A knee-high stone wall around a field, broken wherever a road or water crosses it. */
function buildWall(b: GeometryBatch, polygon: Point[]) {
  polygon.forEach(([ax, az], i) => {
    const [bx, bz] = polygon[(i + 1) % polygon.length]!;
    const length = Math.hypot(bx - ax, bz - az);
    const pieces = Math.max(1, Math.round(length / WALL_STEP));
    for (let p = 0; p < pieces; p++) {
      const x0 = ax + ((bx - ax) * p) / pieces;
      const z0 = az + ((bz - az) * p) / pieces;
      const x1 = ax + ((bx - ax) * (p + 1)) / pieces;
      const z1 = az + ((bz - az) * (p + 1)) / pieces;
      const mx = (x0 + x1) / 2;
      const mz = (z0 + z1) / 2;
      if (roadEdgeDistance(mx, mz) < 0.8 || isInWater(mx, mz)) continue;
      const y0 = heightAt(x0, z0);
      const y1 = heightAt(x1, z1);
      // Walls hold up the terrace edge, so they reach down to the lower side.
      b.beam(
        [x0, Math.min(y0, y1) + 0.15, z0],
        [x1, Math.min(y0, y1) + 0.15, z1],
        0.32,
        PALETTE.darkStone,
      );
      b.beam(
        [x0, Math.max(y0, y1) + 0.35, z0],
        [x1, Math.max(y0, y1) + 0.35, z1],
        0.26,
        PALETTE.stone,
      );
    }
  });
}

function buildBullockCart(b: GeometryBatch) {
  const random = mulberry32(9);
  onGround(b, BULLOCK_CART.x, BULLOCK_CART.z, BULLOCK_CART.rot, () => {
    b.box([1.5, 0.12, 2.4], [0, 1.0, 0], PALETTE.wood);
    for (const side of [-1, 1]) b.box([0.08, 0.35, 2.4], [side * 0.72, 1.2, 0], PALETTE.darkWood);
    for (const side of [-1, 1]) {
      const x = side * 0.9;
      b.cylinder(0.75, 0.75, 0.1, [x, 0.75, -0.2], PALETTE.darkWood, 18, [0, 0, Math.PI / 2]);
      b.cylinder(0.6, 0.6, 0.12, [x, 0.75, -0.2], PALETTE.wood, 18, [0, 0, Math.PI / 2]);
      b.cylinder(0.12, 0.12, 0.2, [x, 0.75, -0.2], PALETTE.iron, 8, [0, 0, Math.PI / 2]);
    }
    // Shafts resting on the ground where the bullocks would be yoked.
    b.beam([-0.4, 1.0, 1.2], [-0.25, 0.15, 3.2], 0.1, PALETTE.wood);
    b.beam([0.4, 1.0, 1.2], [0.25, 0.15, 3.2], 0.1, PALETTE.wood);
    b.beam([-0.9, 0.3, 2.9], [0.9, 0.3, 2.9], 0.12, PALETTE.wood);
    for (let i = 0; i < 4; i++) {
      b.blob(
        0.35,
        [(random() - 0.5) * 0.8, 1.3, (random() - 0.5) * 1.6],
        PALETTE.hay,
        [1, 0.55, 1],
      );
    }
  });
}
