import type { GeometryBatch } from "../batch";
import { HOSPITAL } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

const PLINTH = 0.4;
const CROSS_RED = "#c8232c";

/** A whitewashed two-storey clinic with a red band, a porch and a red cross over the door. */
export function buildHospital(b: GeometryBatch) {
  const { w, d, floorHeight } = HOSPITAL;
  const height = floorHeight * 2;
  onGround(b, HOSPITAL.x, HOSPITAL.z, HOSPITAL.rot, () => {
    b.box([w + 0.6, PLINTH + 1, d + 0.6], [0, PLINTH / 2 - 0.5, 0], PALETTE.darkStone);
    b.box([w, height, d], [0, PLINTH + height / 2, 0], PALETTE.whitewash);
    b.box([w + 0.06, 0.3, d + 0.06], [0, PLINTH + floorHeight, 0], CROSS_RED);
    b.box([w + 0.4, 0.2, d + 0.4], [0, PLINTH + height + 0.1, 0], PALETTE.cream);

    // Rows of windows on both floors, front and back.
    for (let floor = 0; floor < 2; floor++) {
      const y = PLINTH + floor * floorHeight + 1.7;
      for (const x of [-3.5, -1.2, 1.2, 3.5]) {
        if (floor === 0 && Math.abs(x) < 2) continue;
        for (const side of [1, -1]) {
          b.box([1.1, 1.2, 0.08], [x, y, side * (d / 2 + 0.03)], "#6fa7c7");
        }
      }
    }

    // Glass doors under a flat porch roof.
    b.box([2.2, 2.3, 0.1], [0, PLINTH + 1.15, d / 2 + 0.04], "#4f7f99");
    b.box([3.6, 0.18, 2.2], [0, PLINTH + 2.7, d / 2 + 1.1], PALETTE.cream);
    for (const x of [-1.6, 1.6]) {
      b.box([0.2, 2.6, 0.2], [x, PLINTH + 1.3, d / 2 + 2], PALETTE.whitewash);
    }
    b.box([3, PLINTH, 1.4], [0, PLINTH / 2, d / 2 + 1.2], PALETTE.stone);

    // A red cross on a white board above the porch.
    const crossY = PLINTH + floorHeight + 1.1;
    b.box([1.3, 1.3, 0.08], [0, crossY, d / 2 + 0.05], "#ffffff");
    b.box([0.9, 0.28, 0.1], [0, crossY, d / 2 + 0.07], CROSS_RED);
    b.box([0.28, 0.9, 0.1], [0, crossY, d / 2 + 0.07], CROSS_RED);

    // Water tanks on the roof.
    for (const x of [-2.5, 2.5]) {
      b.cylinder(0.6, 0.65, 1, [x, PLINTH + height + 0.7, -d / 4], "#22201e", 12);
    }
  });
}

/** Name board along the top of the front wall, in the hospital's local space. */
export const HOSPITAL_SIGN: [number, number, number] = [
  0,
  PLINTH + HOSPITAL.floorHeight * 2 - 0.55,
  HOSPITAL.d / 2 + 0.08,
];
