import { TorusGeometry } from "three";
import { mulberry32 } from "@/utils/math";
import type { GeometryBatch } from "../batch";
import { BANYAN } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

/** The old banyan: a gnarled trunk on a raised platform, a vast canopy and hanging aerial roots. */
export function buildBanyan(b: GeometryBatch) {
  const random = mulberry32(31);
  const { platformRadius, platformHeight, trunkRadius, canopyRadius } = BANYAN;

  onGround(b, BANYAN.x, BANYAN.z, 0, () => {
    b.cylinder(
      platformRadius,
      platformRadius + 0.15,
      platformHeight,
      [0, platformHeight / 2, 0],
      PALETTE.stone,
      28,
    );
    b.cylinder(
      platformRadius + 0.02,
      platformRadius + 0.02,
      0.08,
      [0, platformHeight, 0],
      PALETTE.whitewash,
      28,
    );

    // Several fused trunks read as one old, twisted tree.
    b.cylinder(trunkRadius * 0.8, trunkRadius * 1.15, 5.5, [0, 3, 0], PALETTE.bark, 12);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      b.cylinder(
        0.35,
        0.55,
        5,
        [Math.cos(angle) * 0.9, 2.8, Math.sin(angle) * 0.9],
        PALETTE.bark,
        8,
        [Math.sin(angle) * 0.18, 0, -Math.cos(angle) * 0.18],
      );
    }
    // Red sacred thread tied around the trunk.
    b.add(new TorusGeometry(trunkRadius * 1.08, 0.05, 6, 28), [0, 1.7, 0], PALETTE.vermilion, [
      Math.PI / 2,
      0,
      0,
    ]);
    b.add(new TorusGeometry(trunkRadius * 1.06, 0.04, 6, 28), [0, 1.9, 0], PALETTE.saffron, [
      Math.PI / 2,
      0,
      0,
    ]);

    for (let i = 0; i < 16; i++) {
      const angle = random() * Math.PI * 2;
      const distance = random() * canopyRadius * 0.7;
      const radius = 3 + random() * 1.8;
      b.blob(
        radius,
        [Math.cos(angle) * distance, 7 + random() * 2.5, Math.sin(angle) * distance],
        random() < 0.5 ? PALETTE.leaf : PALETTE.darkLeaf,
        [1, 0.62, 1],
      );
    }

    // Aerial roots drop from the branches but stay clear of the lane and road.
    for (let i = 0; i < 18; i++) {
      const angle = random() * Math.PI * 2;
      const distance = 4.6 + random() * 3;
      const thickness = 0.04 + random() * 0.06;
      b.cylinder(
        thickness,
        thickness * 1.3,
        6.5,
        [Math.cos(angle) * distance, 3.25, Math.sin(angle) * distance],
        PALETTE.bark,
        5,
      );
    }
  });
}
