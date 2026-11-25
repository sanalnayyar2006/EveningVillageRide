import type { GeometryBatch } from "../batch";
import { TEMPLE, TEMPLE_BELL } from "../data/structures";
import { PALETTE } from "../worldMaterials";
import { onGround } from "../scenery/place";

const SANCTUM_Z = -1.5;
/** Spire tiers from the bottom up: [width, height]. */
const SPIRE_TIERS = [
  [4.2, 1.5],
  [3.5, 1.4],
  [2.8, 1.3],
  [2.1, 1.2],
  [1.4, 1.0],
] as const;

/** A whitewashed temple with a stepped saffron spire, a pillared porch and lamps along the plinth. */
export function buildTemple(b: GeometryBatch) {
  const { plinth, sanctum } = TEMPLE;
  // The front faces south, towards the lane.
  onGround(b, TEMPLE.x, TEMPLE.z, 0, () => {
    b.box([plinth.w, plinth.h + 1, plinth.d], [0, plinth.h / 2 - 0.5, 0], PALETTE.stone);
    b.box([plinth.w + 0.1, 0.08, plinth.d + 0.1], [0, plinth.h, 0], PALETTE.whitewash);
    for (let step = 0; step < 3; step++) {
      const y = plinth.h - (step + 1) * (plinth.h / 3);
      b.box(
        [4, plinth.h / 3, 0.45],
        [0, y + plinth.h / 6, plinth.d / 2 + 0.22 + step * 0.45],
        PALETTE.stone,
      );
    }

    const floor = plinth.h;
    b.box(
      [sanctum.w, sanctum.h, sanctum.d],
      [0, floor + sanctum.h / 2, SANCTUM_Z],
      PALETTE.whitewash,
    );
    b.box(
      [sanctum.w + 0.1, 0.25, sanctum.d + 0.1],
      [0, floor + sanctum.h, SANCTUM_Z],
      PALETTE.saffron,
    );
    b.box([1.1, 2, 0.1], [0, floor + 1, SANCTUM_Z + sanctum.d / 2 + 0.02], "#3a1d12");
    b.glowing(() =>
      b.box(
        [0.3, 0.3, 0.06],
        [0, floor + 0.55, SANCTUM_Z + sanctum.d / 2 + 0.05],
        PALETTE.windowDark,
      ),
    );

    // Four-sided cylinders turned 45° give square, tapering tiers.
    let y = floor + sanctum.h + 0.12;
    SPIRE_TIERS.forEach(([width, height], i) => {
      const radius = width / Math.SQRT2;
      const colour = i % 2 === 0 ? PALETTE.saffron : PALETTE.cream;
      b.cylinder(radius * 0.86, radius, height, [0, y + height / 2, SANCTUM_Z], colour, 4, [
        0,
        Math.PI / 4,
        0,
      ]);
      y += height;
    });
    b.cylinder(0.75, 0.75, 0.3, [0, y + 0.15, SANCTUM_Z], PALETTE.stone, 16);
    b.sphere(0.35, [0, y + 0.55, SANCTUM_Z], PALETTE.gold);
    b.cone(0.12, 0.4, [0, y + 1, SANCTUM_Z], PALETTE.gold, 8);

    // Porch on four pillars.
    for (const x of [-1.7, 1.7]) {
      for (const z of [1.2, 4.2]) {
        b.cylinder(0.17, 0.2, 2.6, [x, floor + 1.3, z], PALETTE.whitewash, 10);
      }
    }
    b.box([4.5, 0.25, 4], [0, floor + 2.72, 2.7], PALETTE.cream);
    b.box([4.6, 0.12, 4.1], [0, floor + 2.6, 2.7], PALETTE.saffron);
    b.sphere(0.8, [0, floor + 2.85, 2.7], PALETTE.saffron, [1, 0.7, 1]);

    // Oil lamps along the front edge of the plinth.
    b.glowing(() => {
      for (let i = 0; i < 9; i++) {
        const x = -plinth.w / 2 + 0.6 + i * ((plinth.w - 1.2) / 8);
        if (Math.abs(x) < 2.2) continue;
        b.sphere(0.07, [x, floor + 0.1, plinth.d / 2 - 0.25], "#ffffff");
      }
    });
  });

  buildBellArch(b);
}

/** Top of the spire relative to the ground, for the flag pole. */
export const TEMPLE_SPIRE_TOP = {
  x: TEMPLE.x,
  y: TEMPLE.plinth.h + TEMPLE.sanctum.h + SPIRE_TIERS.reduce((sum, [, h]) => sum + h, 0) + 1.5,
  z: TEMPLE.z + SANCTUM_Z,
} as const;

/** The arch over the lane where visitors ring the bell on the way in. */
function buildBellArch(b: GeometryBatch) {
  const { height } = TEMPLE_BELL;
  onGround(b, TEMPLE_BELL.x, TEMPLE_BELL.z, 0, () => {
    for (const x of [-1.2, 1.2]) {
      b.cylinder(0.11, 0.13, height, [x, height / 2, 0], PALETTE.vermilion, 8);
    }
    b.box([3, 0.18, 0.18], [0, height, 0], PALETTE.saffron);
    b.cylinder(0.01, 0.01, 0.5, [0, height - 0.3, 0], PALETTE.gold, 4);
    b.cylinder(0.1, 0.24, 0.36, [0, height - 0.72, 0], PALETTE.gold, 14);
    b.sphere(0.05, [0, height - 0.93, 0], PALETTE.gold);
  });
}
