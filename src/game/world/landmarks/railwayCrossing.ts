import type { GeometryBatch } from "../batch";
import { RAILWAY } from "../data/layout";
import { CROSSING } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { heightAt } from "../terrain";
import { onGround } from "../scenery/place";

const GAUGE = 1.44;
const SLEEPER_SPACING = 0.7;
/** The road crosses here, so no ballast is laid across it. */
const ROAD_GAP = 3;

/** Track running north–south across the map, with a level crossing, barriers and a signal cabin. */
export function buildRailwayCrossing(b: GeometryBatch) {
  const bed = heightAt(RAILWAY.x, 0) + 0.08;
  const { halfLength } = RAILWAY;

  // Gravel ballast on either side of the road.
  const ballastLength = halfLength - ROAD_GAP;
  for (const side of [-1, 1]) {
    b.box(
      [3.2, 0.22, ballastLength],
      [RAILWAY.x, bed, side * (ROAD_GAP + ballastLength / 2)],
      "#8a837a",
    );
  }
  for (let z = -halfLength; z <= halfLength; z += SLEEPER_SPACING) {
    if (Math.abs(z) < ROAD_GAP) continue;
    b.box([2.5, 0.1, 0.22], [RAILWAY.x, bed + 0.15, z], "#5a4a3c");
  }
  for (const side of [-1, 1]) {
    b.box([0.08, 0.14, halfLength * 2], [RAILWAY.x + (side * GAUGE) / 2, bed + 0.26, 0], "#6f6a66");
  }

  // Lifting barriers, raised, one on each approach.
  for (const side of [-1, 1]) {
    const x = RAILWAY.x - side * CROSSING.boomOffset;
    const z = side * 3.4;
    onGround(b, x, z, 0, () => {
      b.box([0.3, 1.1, 0.3], [0, 0.55, 0], PALETTE.whitewash);
      b.box([0.45, 0.4, 0.3], [0, 1.25, 0], PALETTE.iron);
      for (let i = 0; i < 6; i++) {
        b.box(
          [0.12, 0.7, 0.12],
          [0, 1.6 + i * 0.7, 0],
          i % 2 ? PALETTE.whitewash : PALETTE.vermilion,
        );
      }
    });
  }

  // Signal cabin in railway yellow.
  onGround(b, CROSSING.cabin.x, CROSSING.cabin.z, -Math.PI / 2, () => {
    b.box([2.6, 0.3, 2.6], [0, 0.15, 0], PALETTE.stone);
    b.box([2.4, 2.4, 2.4], [0, 1.5, 0], "#e7c14a");
    b.box([2.42, 0.35, 2.42], [0, 0.48, 0], "#a8372b");
    b.box([2.9, 0.15, 2.9], [0, 2.78, 0], "#a8372b");
    b.box([0.9, 1.9, 0.08], [-0.5, 1.25, 1.22], PALETTE.darkWood);
    b.box([0.8, 0.7, 0.08], [0.55, 1.7, 1.22], PALETTE.windowDark);
  });

  // Signal post beside the track.
  onGround(b, RAILWAY.x + 2.6, -9, 0, () => {
    b.cylinder(0.08, 0.1, 4.5, [0, 2.25, 0], PALETTE.iron, 8);
    b.box([0.4, 0.9, 0.25], [0, 4.3, 0.1], PALETTE.iron);
    b.sphere(0.11, [0, 4.5, 0.25], "#d63a2a");
    b.sphere(0.11, [0, 4.1, 0.25], "#3a5a3a");
  });
}
