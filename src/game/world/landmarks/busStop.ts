import type { GeometryBatch } from "../batch";
import { BUS_STOP } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

/** A concrete shelter facing the main road, with a bench and a sign post. */
export function buildBusStop(b: GeometryBatch) {
  const { length, depth, height } = BUS_STOP;
  // Facing -X, towards the road.
  onGround(b, BUS_STOP.x, BUS_STOP.z, -Math.PI / 2, () => {
    b.box([length, 0.15, depth], [0, 0.075, 0], PALETTE.stone);
    b.box([length, height, 0.2], [0, height / 2, -depth / 2], "#79b4be");
    b.box([length, 0.6, 0.22], [0, 0.3, -depth / 2], "#3e6f7a");
    for (const x of [-length / 2 + 0.1, length / 2 - 0.1]) {
      b.box([0.12, height, 0.12], [x, height / 2, depth / 2 - 0.1], PALETTE.whitewash);
    }
    b.box(
      [length + 0.5, 0.12, depth + 0.6],
      [0, height + 0.05, 0.1],
      PALETTE.whitewash,
      [-0.06, 0, 0],
    );
    b.box([length - 0.6, 0.08, 0.45], [0, 0.48, -depth / 2 + 0.4], PALETTE.wood);
    b.box([length - 0.6, 0.4, 0.06], [0, 0.25, -depth / 2 + 0.6], PALETTE.darkWood);
    b.cylinder(0.04, 0.04, 2.5, [length / 2 + 0.8, 1.25, depth / 2], PALETTE.iron, 6);
  });
}

/** Sign plate on the post beside the shelter, in world space. */
export const BUS_STOP_SIGN = {
  x: BUS_STOP.x - BUS_STOP.depth / 2,
  z: BUS_STOP.z + BUS_STOP.length / 2 + 0.8,
  y: 2.55,
} as const;
