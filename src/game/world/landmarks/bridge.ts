import type { GeometryBatch } from "../batch";
import { BRIDGE, RIVER } from "../data/layout";
import { PALETTE } from "../worldMaterials";
import { heightAt } from "../terrain";

const DECK_THICKNESS = 0.4;
const SEGMENT = 0.5;
const PARAPET_HEIGHT = 0.75;

/**
 * The arched stone bridge. The deck is a run of short blocks tilted to follow
 * heightAt(), so what you see matches what the bike rides on.
 */
export function buildBridge(b: GeometryBatch) {
  const width = BRIDGE.halfWidth * 2;
  const start = BRIDGE.z - BRIDGE.halfLength;
  const count = Math.round((BRIDGE.halfLength * 2) / SEGMENT);

  for (let i = 0; i < count; i++) {
    const z0 = start + i * SEGMENT;
    const z1 = z0 + SEGMENT;
    const y0 = heightAt(BRIDGE.x, z0);
    const y1 = heightAt(BRIDGE.x, z1);
    const tilt = -Math.atan2(y1 - y0, SEGMENT);
    const z = (z0 + z1) / 2;
    const y = (y0 + y1) / 2;
    // A little overlap hides seams between blocks.
    b.box(
      [width, DECK_THICKNESS, SEGMENT + 0.04],
      [BRIDGE.x, y - DECK_THICKNESS / 2, z],
      PALETTE.stone,
      [tilt, 0, 0],
    );
    for (const side of [-1, 1]) {
      const x = BRIDGE.x + side * BRIDGE.halfWidth;
      b.box([0.3, PARAPET_HEIGHT, SEGMENT + 0.04], [x, y + PARAPET_HEIGHT / 2, z], PALETTE.cream, [
        tilt,
        0,
        0,
      ]);
      b.box([0.38, 0.08, SEGMENT + 0.04], [x, y + PARAPET_HEIGHT + 0.04, z], PALETTE.whitewash, [
        tilt,
        0,
        0,
      ]);
    }
  }

  // Two piers standing in the river.
  for (const offset of [-3.2, 3.2]) {
    const z = BRIDGE.z + offset;
    const top = heightAt(BRIDGE.x, z) - DECK_THICKNESS;
    const bottom = RIVER.waterY - 1;
    b.box([width - 0.6, top - bottom, 1.2], [BRIDGE.x, (top + bottom) / 2, z], PALETTE.darkStone);
  }
}
