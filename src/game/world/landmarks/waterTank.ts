import type { GeometryBatch } from "../batch";
import { WATER_TANK } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

const CONCRETE = "#d4cbb9";

/** The village's overhead water tank on four braced legs, with a ladder up one side. */
export function buildWaterTank(b: GeometryBatch) {
  const { legSpread: s, tankHeight, tankRadius } = WATER_TANK;
  const corners: [number, number][] = [
    [-s, -s],
    [s, -s],
    [s, s],
    [-s, s],
  ];

  onGround(b, WATER_TANK.x, WATER_TANK.z, 0, () => {
    for (const [x, z] of corners) {
      b.cylinder(0.24, 0.3, tankHeight, [x, tankHeight / 2, z], CONCRETE, 8);
    }
    // Horizontal braces between neighbouring legs at two heights.
    for (const y of [tankHeight * 0.35, tankHeight * 0.7]) {
      corners.forEach(([x, z], i) => {
        const [nx, nz] = corners[(i + 1) % corners.length] ?? corners[0]!;
        b.beam([x, y, z], [nx, y, nz], 0.22, CONCRETE);
      });
    }

    b.cylinder(tankRadius, tankRadius, 3.2, [0, tankHeight + 1.6, 0], CONCRETE, 24);
    b.cylinder(tankRadius + 0.05, tankRadius + 0.05, 0.35, [0, tankHeight + 2.3, 0], "#5e8fb2", 24);
    b.cone(tankRadius + 0.15, 1.1, [0, tankHeight + 3.75, 0], PALETTE.darkStone, 24);

    // Ladder up the south-east leg.
    const [lx, lz] = [s + 0.35, s + 0.1];
    b.beam([lx - 0.2, 0, lz], [lx - 0.2, tankHeight, lz], 0.05, PALETTE.iron);
    b.beam([lx + 0.2, 0, lz], [lx + 0.2, tankHeight, lz], 0.05, PALETTE.iron);
    for (let y = 0.4; y < tankHeight; y += 0.45) {
      b.beam([lx - 0.2, y, lz], [lx + 0.2, y, lz], 0.03, PALETTE.iron);
    }
  });
}
