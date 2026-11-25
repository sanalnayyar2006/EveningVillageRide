import { mulberry32 } from "@/utils/math";
import type { GeometryBatch } from "../batch";
import { MARKET_STALLS, STALL_SIZE } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

const PRODUCE = ["#f08c28", "#d23c28", "#5f9a35", "#e8c840", "#9b4a6a", "#f2d7a0"];

/** Canopied stalls lining the east road, piled with fruit and vegetables, hung with marigolds. */
export function buildMarket(b: GeometryBatch) {
  const random = mulberry32(55);
  const { w, d } = STALL_SIZE;

  for (const stall of MARKET_STALLS) {
    // Stalls on the north side face south onto the road, and vice versa.
    const facing = stall.z < 0 ? 0 : Math.PI;
    onGround(b, stall.x, stall.z, facing, () => {
      for (const [x, z, height] of [
        [-w / 2, d / 2, 2.3],
        [w / 2, d / 2, 2.3],
        [-w / 2, -d / 2, 2.0],
        [w / 2, -d / 2, 2.0],
      ] as const) {
        b.box([0.07, height, 0.07], [x, height / 2, z], PALETTE.wood);
      }
      b.box([w + 0.5, 0.05, d + 0.6], [0, 2.2, 0.1], stall.canopy, [0.12, 0, 0]);
      b.box([w + 0.5, 0.25, 0.04], [0, 2.1, d / 2 + 0.42], stall.canopy);

      b.box([w - 0.2, 0.08, d * 0.62], [0, 0.82, 0.25], PALETTE.wood);
      b.box([w - 0.3, 0.78, 0.05], [0, 0.39, 0.25 + d * 0.3], PALETTE.darkWood);

      // Neat heaps of produce, one colour per heap.
      for (let heap = 0; heap < 3; heap++) {
        const colour = PRODUCE[Math.floor(random() * PRODUCE.length)] ?? "#f08c28";
        const cx = -w / 2 + 0.6 + (heap * (w - 1.2)) / 2;
        for (let i = 0; i < 7; i++) {
          const layer = i < 4 ? 0 : 1;
          const ring = layer === 0 ? i : i - 4;
          const angle = (ring / (layer === 0 ? 4 : 3)) * Math.PI * 2;
          const spread = layer === 0 ? 0.18 : 0.08;
          b.sphere(
            0.09,
            [cx + Math.cos(angle) * spread, 0.95 + layer * 0.12, 0.25 + Math.sin(angle) * spread],
            colour,
          );
        }
      }

      // A string of marigolds along the canopy edge.
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const sag = Math.sin(t * Math.PI) * 0.25;
        b.sphere(
          0.06,
          [-w / 2 + t * w, 1.95 - sag, d / 2 + 0.44],
          i % 2 ? PALETTE.saffron : "#f2c230",
        );
      }

      b.box([0.5, 0.35, 0.4], [w / 2 - 0.3, 0.18, -0.4], "#a4783f");
      b.cylinder(0.25, 0.2, 0.3, [-w / 2 + 0.4, 0.15, -0.4], "#c99a52", 10);
    });
  }
}
