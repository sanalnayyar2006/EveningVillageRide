import type { GeometryBatch } from "../batch";
import { SUBSTATION } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

const STEEL = "#a7adb0";
const PORCELAIN = "#8a5a3c";
const FENCE_HEIGHT = 2.4;
const POST_SPACING = 3;
/** Gantry rows across the yard, in local Z, and how many bays each spans. */
const GANTRY_ROWS = [-8, 6, 20] as const;
const BAYS = 6;

/** A lattice-steel gantry: two towers joined by a beam, with insulators hanging from it. */
function gantry(b: GeometryBatch, z: number, span: number) {
  const height = 10;
  for (const side of [-1, 1]) {
    const x = (side * span) / 2;
    for (const [dx, dz] of [
      [-0.4, -0.4],
      [0.4, -0.4],
      [0.4, 0.4],
      [-0.4, 0.4],
    ] as const) {
      b.beam([x + dx * 1.6, 0, z + dz * 1.6], [x + dx * 0.5, height, z + dz * 0.5], 0.09, STEEL);
    }
    for (let y = 1.5; y < height; y += 2) {
      b.beam([x - 0.5, y, z], [x + 0.5, y + 1.5, z], 0.05, STEEL);
    }
  }
  b.beam([-span / 2, height, z], [span / 2, height, z], 0.35, STEEL);
  for (let i = 0; i < BAYS; i++) {
    const x = -span / 2 + (span * (i + 0.5)) / BAYS;
    b.cylinder(0.12, 0.12, 1.4, [x, height - 0.9, z], PORCELAIN, 6);
  }
}

/** A transformer: a grey tank with cooling fins and three bushings on top. */
function transformer(b: GeometryBatch, x: number, z: number) {
  b.box([3.2, 0.3, 2.4], [x, 0.15, z], PALETTE.stone);
  b.box([2.6, 2.6, 1.8], [x, 1.6, z], "#7d8a83");
  for (const side of [-1, 1]) b.box([2.4, 2, 0.3], [x, 1.5, z + side * 1.05], "#6c7872");
  for (const dx of [-0.8, 0, 0.8]) b.cylinder(0.1, 0.14, 1.1, [x + dx, 3.4, z], PORCELAIN, 6);
}

/** The fenced 220 kV yard south of the highway, with its control building. */
export function buildSubstation(b: GeometryBatch) {
  const { w, d, building } = SUBSTATION;
  onGround(b, SUBSTATION.x, SUBSTATION.z, SUBSTATION.rot, () => {
    // Chain-link fence: posts with a mesh panel between each pair.
    const corners: [number, number][] = [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, d / 2],
      [-w / 2, d / 2],
    ];
    corners.forEach(([ax, az], i) => {
      const [bx, bz] = corners[(i + 1) % 4]!;
      const length = Math.hypot(bx - ax, bz - az);
      const posts = Math.round(length / POST_SPACING);
      for (let p = 0; p <= posts; p++) {
        const x = ax + ((bx - ax) * p) / posts;
        const z = az + ((bz - az) * p) / posts;
        b.box([0.1, FENCE_HEIGHT, 0.1], [x, FENCE_HEIGHT / 2, z], PALETTE.iron);
      }
      b.beam([ax, FENCE_HEIGHT - 0.05, az], [bx, FENCE_HEIGHT - 0.05, bz], 0.05, PALETTE.iron);
      b.beam([ax, 0.1, az], [bx, 0.1, bz], 0.05, PALETTE.iron);
    });

    // Control building with a blue tin roof, as seen from above.
    b.box(
      [building.w, building.h, building.d],
      [building.x, building.h / 2, building.z],
      PALETTE.cream,
    );
    b.box(
      [building.w + 0.8, 0.15, building.d + 0.8],
      [building.x, building.h + 0.3, building.z],
      "#4f7fae",
      [0.08, 0, 0],
    );
    for (let i = 0; i < 4; i++) {
      const x = building.x - building.w / 2 + 3 + i * 4.5;
      b.box([1.4, 1.1, 0.08], [x, 2.6, building.z + building.d / 2 + 0.03], PALETTE.windowDark);
    }

    for (const z of GANTRY_ROWS) gantry(b, z, w * 0.6);
    for (let i = 0; i < 4; i++) transformer(b, -w * 0.25 + i * (w * 0.17), 13);
  });
}

/** Warning board on the north fence, facing the highway, in the yard's local space. */
export const SUBSTATION_SIGN: [number, number, number] = [0, 1.6, -SUBSTATION.d / 2 - 0.08];
