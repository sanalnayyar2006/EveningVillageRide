import { mulberry32 } from "@/utils/math";
import type { GeometryBatch } from "../batch";
import { FIELDS } from "../data/layout";
import { BULLOCK_CART, HAYSTACKS, SCARECROWS } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { heightAt, roadEdgeDistance } from "../terrain";
import { onGround } from "../scenery/place";

const FENCE_SPACING = 2.6;

/** Fences around the fields, haystacks, scarecrows and a resting bullock cart. Crops are in Crops.tsx. */
export function buildFields(b: GeometryBatch) {
  for (const field of FIELDS) buildFence(b, field.min, field.max);

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

/** Posts every few metres along the field edge with a rail between them, skipping roads. */
function buildFence(b: GeometryBatch, min: [number, number], max: [number, number]) {
  const corners: [number, number][] = [
    [min[0], min[1]],
    [max[0], min[1]],
    [max[0], max[1]],
    [min[0], max[1]],
  ];
  corners.forEach(([ax, az], i) => {
    const [bx, bz] = corners[(i + 1) % 4] ?? corners[0]!;
    const length = Math.hypot(bx - ax, bz - az);
    const posts = Math.max(1, Math.round(length / FENCE_SPACING));
    let previous: [number, number, number] | null = null;
    for (let p = 0; p <= posts; p++) {
      const x = ax + ((bx - ax) * p) / posts;
      const z = az + ((bz - az) * p) / posts;
      const y = heightAt(x, z);
      if (roadEdgeDistance(x, z) < 0.6 || y < -0.1) {
        previous = null;
        continue;
      }
      b.box([0.1, 1, 0.1], [x, y + 0.5, z], PALETTE.wood);
      if (previous)
        b.beam([previous[0], previous[1] + 0.7, previous[2]], [x, y + 0.7, z], 0.05, "#8a6844");
      previous = [x, y, z];
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
