import { mulberry32 } from "@/utils/math";
import type { GeometryBatch } from "../batch";
import { POND } from "../data/layout";
import { POND_WATER_Y } from "../terrain";
import { PALETTE } from "../worldMaterials";

/** Stone ghat steps down to the water on the north bank, and lily pads with lotus flowers. */
export function buildPond(b: GeometryBatch) {
  const random = mulberry32(77);

  // Each step is a tall block so nothing shows underneath; tops step down from the bank to the water.
  const steps = 5;
  const bank = POND_WATER_Y + 0.45;
  for (let i = 0; i < steps; i++) {
    const top = bank - i * (0.5 / (steps - 1));
    const z = POND.z - POND.radius - 2.2 + i * 0.65;
    b.box(
      [7 - i * 0.3, 1.5, 0.66],
      [POND.x, top - 0.75, z],
      i % 2 ? PALETTE.stone : PALETTE.darkStone,
    );
  }

  for (let i = 0; i < 34; i++) {
    const angle = random() * Math.PI * 2;
    const distance = 2.5 + random() * (POND.radius - 3.5);
    const x = POND.x + Math.cos(angle) * distance;
    const z = POND.z + Math.sin(angle) * distance;
    const size = 0.35 + random() * 0.3;
    b.cylinder(
      size,
      size,
      0.03,
      [x, POND_WATER_Y + 0.03, z],
      random() < 0.5 ? "#4f7d34" : "#3f6a2c",
      9,
    );
    if (random() < 0.3) {
      b.cone(0.13, 0.22, [x + 0.1, POND_WATER_Y + 0.15, z], "#f2a6c0", 6);
      b.sphere(0.04, [x + 0.1, POND_WATER_Y + 0.18, z], "#f6d26a");
    }
  }
}
