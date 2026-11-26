import type { GeometryBatch } from "../batch";
import { TEA_STALL } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

/** Glass jars of biscuits and rusks on the counter. */
const JAR_COLOURS = ["#e3b04b", "#d96a3b", "#9bbf5a", "#e3b04b"];

/** A small roadside chai stall: tin roof, wooden counter, kettle on the stove, jars of biscuits. */
export function buildTeaStall(b: GeometryBatch) {
  const { w, d, h } = TEA_STALL;
  onGround(b, TEA_STALL.x, TEA_STALL.z, TEA_STALL.rot, () => {
    b.box([w, 0.2, d], [0, 0.1, 0], PALETTE.stone);
    b.box([w, h, 0.12], [0, h / 2, -d / 2], "#e8d9b5");
    b.box([0.12, h, d], [-w / 2, h / 2, 0], "#e8d9b5");
    b.box([0.12, h, d], [w / 2, h / 2, 0], "#e8d9b5");
    b.box([w, 1, 0.5], [0, 0.5, d / 2 - 0.25], "#2f6f8f");
    b.box([w + 0.1, 0.06, 0.6], [0, 1.03, d / 2 - 0.25], PALETTE.wood);
    for (const x of [-w / 2 - 0.4, w / 2 + 0.4]) {
      b.box([0.08, h + 0.35, 0.08], [x, (h + 0.35) / 2, d / 2 + 0.7], PALETTE.wood);
    }
    // Corrugated tin roof sloping out over the customers.
    b.box([w + 1.2, 0.05, d + 1.8], [0, h + 0.25, 0.5], PALETTE.tin, [0.1, 0, 0]);

    // Counter-top details.
    b.box([0.5, 0.2, 0.35], [-0.9, 1.16, d / 2 - 0.25], PALETTE.iron);
    b.cylinder(0.12, 0.15, 0.22, [-0.9, 1.37, d / 2 - 0.25], PALETTE.tin, 12);
    b.sphere(0.04, [-0.9, 1.5, d / 2 - 0.25], PALETTE.iron);
    JAR_COLOURS.forEach((colour, i) => {
      b.cylinder(0.09, 0.09, 0.26, [0.2 + i * 0.28, 1.19, d / 2 - 0.25], colour, 10);
    });
    // A stack of small clay cups.
    for (let i = 0; i < 5; i++) {
      b.cylinder(0.03, 0.025, 0.07, [1.45, 1.1 + i * 0.07, d / 2 - 0.3], "#f4efe6", 8);
    }
  });
}

/** Sign above the counter, in the stall's local space. */
export const TEA_STALL_SIGN: [number, number, number] = [
  0,
  TEA_STALL.h - 0.35,
  TEA_STALL.d / 2 + 0.05,
];
