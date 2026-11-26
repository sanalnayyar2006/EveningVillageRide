import type { GeometryBatch } from "../batch";
import { GATE } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

/** Two painted pillars joined by a beam that carries the welcome sign. */
export function buildGate(b: GeometryBatch) {
  onGround(b, GATE.x, GATE.z, GATE.rot, () => {
    for (const side of [-1, 1]) {
      const x = side * GATE.halfSpan;
      b.box([GATE.pillar + 0.2, 0.5, GATE.pillar + 0.2], [x, 0.25, 0], PALETTE.stone);
      b.box([GATE.pillar, GATE.height, GATE.pillar], [x, GATE.height / 2, 0], PALETTE.cream);
      b.box([GATE.pillar + 0.2, 0.25, GATE.pillar + 0.2], [x, GATE.height, 0], PALETTE.saffron);
      b.sphere(0.34, [x, GATE.height + 0.38, 0], PALETTE.saffron, [1, 0.8, 1]);
      b.sphere(0.12, [x, GATE.height + 0.75, 0], PALETTE.gold);
    }
    const span = GATE.halfSpan * 2 + GATE.pillar;
    b.box([span, 0.9, 0.6], [0, GATE.height - 0.65, 0], PALETTE.cream);
    b.box([span + 0.1, 0.12, 0.66], [0, GATE.height - 0.15, 0], PALETTE.saffron);
    b.box([span + 0.1, 0.12, 0.66], [0, GATE.height - 1.15, 0], PALETTE.saffron);
  });
}

/** Height of the sign boards on the gate's beam, front and back. */
export const GATE_SIGN_Y = GATE.height - 0.65;
