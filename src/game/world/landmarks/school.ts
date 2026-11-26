import type { GeometryBatch } from "../batch";
import { CRICKET_PITCH, SCHOOL } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

const PLINTH = 0.35;
const VERANDA_DEPTH = 2.2;

/** A government primary school: cream walls, a blue dado, a pillared veranda and a flag pole. */
export function buildSchool(b: GeometryBatch) {
  const { w, d, h } = SCHOOL;
  onGround(b, SCHOOL.x, SCHOOL.z, SCHOOL.rot, () => {
    b.box(
      [w + 0.4, PLINTH + 1, d + VERANDA_DEPTH * 2],
      [0, PLINTH / 2 - 0.5, VERANDA_DEPTH / 2],
      PALETTE.darkStone,
    );
    b.box([w, h, d], [0, PLINTH + h / 2, 0], PALETTE.cream);
    b.box([w + 0.04, 0.9, d + 0.04], [0, PLINTH + 0.45, 0], "#3d6fa8");

    for (let i = 0; i < 3; i++) {
      const x = -w / 2 + 2.5 + i * ((w - 5) / 2);
      b.box([1.1, 2.1, 0.1], [x, PLINTH + 1.05, d / 2 + 0.03], "#2f5a3a");
    }
    for (let i = 0; i < 4; i++) {
      const x = -w / 2 + 4.1 + i * ((w - 8.2) / 3);
      b.box([1.3, 1.1, 0.06], [x, PLINTH + 1.9, d / 2 + 0.03], PALETTE.whitewash);
      b.box([1.1, 0.9, 0.08], [x, PLINTH + 1.9, d / 2 + 0.04], PALETTE.windowDark);
    }

    // Veranda: a roof on whitewashed pillars along the front.
    b.box(
      [w + 0.6, 0.2, VERANDA_DEPTH + 0.3],
      [0, PLINTH + h - 0.1, d / 2 + VERANDA_DEPTH / 2],
      PALETTE.whitewash,
    );
    for (let i = 0; i < 7; i++) {
      const x = -w / 2 + 0.2 + i * ((w - 0.4) / 6);
      b.box(
        [0.28, h - 0.2, 0.28],
        [x, PLINTH + (h - 0.2) / 2, d / 2 + VERANDA_DEPTH - 0.1],
        PALETTE.whitewash,
      );
    }

    b.box([w + 0.3, 0.2, d + 0.3], [0, PLINTH + h + 0.1, 0], PALETTE.whitewash);
    b.box([w + 0.3, 0.45, 0.15], [0, PLINTH + h + 0.42, d / 2 + 0.08], PALETTE.cream);

    // Flag pole in the yard, with the tricolour.
    const pole: [number, number] = [w / 2 - 1.5, d / 2 + 6];
    b.box([1.2, 0.4, 1.2], [pole[0], 0.2, pole[1]], PALETTE.whitewash);
    b.cylinder(0.04, 0.05, 7, [pole[0], 3.5, pole[1]], PALETTE.whitewash, 8);
    const flagX = pole[0] - 0.75;
    b.box([1.4, 0.3, 0.02], [flagX, 6.6, pole[1]], "#f08a24");
    b.box([1.4, 0.3, 0.02], [flagX, 6.3, pole[1]], "#f7f4ee");
    b.box([1.4, 0.3, 0.02], [flagX, 6.0, pole[1]], "#2e8b3a");
    b.cylinder(0.11, 0.11, 0.03, [flagX, 6.3, pole[1]], "#1f3b8c", 16, [Math.PI / 2, 0, 0]);
  });

  buildCricketPitch(b);
}

/** A bare strip of earth with stumps at both ends, where the evening match is played. */
function buildCricketPitch(b: GeometryBatch) {
  const { length } = CRICKET_PITCH;
  onGround(b, CRICKET_PITCH.x, CRICKET_PITCH.z, CRICKET_PITCH.rot, () => {
    b.box([2.6, 0.04, length + 2], [0, 0.02, 0], "#b99668");
    for (const end of [-length / 2, length / 2]) {
      for (const x of [-0.12, 0, 0.12]) b.cylinder(0.02, 0.02, 0.72, [x, 0.36, end], "#e9dcc0", 5);
      b.box([0.3, 0.025, 0.03], [0, 0.73, end], "#e9dcc0");
    }
  });
}

/** Sign board above the doors, in the school's local space. */
export const SCHOOL_SIGN: [number, number, number] = [
  0,
  PLINTH + SCHOOL.h - 0.55,
  SCHOOL.d / 2 + 0.08,
];
