import { BRIDGE, HOUSES, POND, RIVER, WORLD, riverMeander } from "./layout";
import {
  BANYAN,
  BUS_STOP,
  CROSSING,
  GATE,
  HAYSTACKS,
  MARKET_STALLS,
  SCHOOL,
  STALL_SIZE,
  TEA_STALL,
  TEMPLE,
  TEMPLE_BELL,
  WATER_TANK,
  WELL,
  BULLOCK_CART,
} from "./structures";
import { TREES } from "./vegetation";

/**
 * A solid footprint on the ground. `hx`/`hz` are half-extents, `h` is the full
 * height. Invisible obstacles (river banks, pond edge) block the bike but not the camera.
 */
export type Obstacle =
  | {
      kind: "box";
      x: number;
      z: number;
      hx: number;
      hz: number;
      h: number;
      rot: number;
      invisible?: boolean;
    }
  | { kind: "cylinder"; x: number; z: number; r: number; h: number; invisible?: boolean };

const box = (x: number, z: number, hx: number, hz: number, h: number, rot = 0): Obstacle => ({
  kind: "box",
  x,
  z,
  hx,
  hz,
  h,
  rot,
});
const cyl = (x: number, z: number, r: number, h: number): Obstacle => ({
  kind: "cylinder",
  x,
  z,
  r,
  h,
});
const invisible = (obstacle: Obstacle): Obstacle => ({ ...obstacle, invisible: true });

/**
 * Invisible walls along both banks, starting right where the bridge parapets
 * end. They cover the channel up to near the top of the bank, so the bike
 * stops on dry ground instead of rolling down into the water.
 */
function riverBanks(): Obstacle[] {
  const out: Obstacle[] = [];
  const step = 6;
  const halfDepth = RIVER.bankHalfWidth - 0.8;
  for (const side of [-1, 1]) {
    for (let offset = BRIDGE.halfWidth + step / 2; offset < WORLD.extent / 2; offset += step) {
      const x = side * offset;
      out.push(invisible(box(x, RIVER.z + riverMeander(x), step / 2 + 0.4, halfDepth, 4)));
    }
  }
  return out;
}

/** Everything the bike can bump into, including every tree trunk inside the ride area. */
export const OBSTACLES: Obstacle[] = [
  ...HOUSES.map((h) => box(h.x, h.z, h.w / 2, h.d / 2, h.h * (h.floors ?? 1), h.rot)),
  box(-GATE.halfSpan, GATE.z, GATE.pillar / 2, GATE.pillar / 2, GATE.height),
  box(GATE.halfSpan, GATE.z, GATE.pillar / 2, GATE.pillar / 2, GATE.height),
  box(BUS_STOP.x + BUS_STOP.depth / 2, BUS_STOP.z, 0.2, BUS_STOP.length / 2, BUS_STOP.height),
  cyl(BANYAN.x, BANYAN.z, BANYAN.platformRadius, 2),
  cyl(WELL.x, WELL.z, WELL.radius, 1),
  box(TEA_STALL.x, TEA_STALL.z, TEA_STALL.w / 2, TEA_STALL.d / 2, TEA_STALL.h),
  ...MARKET_STALLS.map((s) => box(s.x, s.z, STALL_SIZE.w / 2, STALL_SIZE.d / 2, 2.4)),
  box(TEMPLE.x, TEMPLE.z, TEMPLE.plinth.w / 2, TEMPLE.plinth.d / 2, TEMPLE.spireHeight),
  cyl(TEMPLE_BELL.x - 1.2, TEMPLE_BELL.z, 0.2, 3),
  cyl(TEMPLE_BELL.x + 1.2, TEMPLE_BELL.z, 0.2, 3),
  // The school faces south; its veranda adds 2.2 m on that side.
  box(SCHOOL.x, SCHOOL.z - 1.1, SCHOOL.w / 2, SCHOOL.d / 2 + 1.1, SCHOOL.h),
  ...[-1, 1].flatMap((sx) =>
    [-1, 1].map((sz) =>
      cyl(
        WATER_TANK.x + sx * WATER_TANK.legSpread,
        WATER_TANK.z + sz * WATER_TANK.legSpread,
        0.3,
        11,
      ),
    ),
  ),
  box(CROSSING.cabin.x, CROSSING.cabin.z, 1.3, 1.3, 2.6),
  ...HAYSTACKS.map((h) => cyl(h.x, h.z, h.r * 0.95, 2.4)),
  box(BULLOCK_CART.x, BULLOCK_CART.z, 1.1, 2.2, 1.4, BULLOCK_CART.rot),
  // Wide enough that the bike stops at the top of the pond's sloping edge.
  invisible(cyl(POND.x, POND.z, POND.radius + 1.2, 3)),
  // Bridge parapets.
  box(BRIDGE.x - BRIDGE.halfWidth, BRIDGE.z, 0.15, BRIDGE.halfLength, 2.2),
  box(BRIDGE.x + BRIDGE.halfWidth, BRIDGE.z, 0.15, BRIDGE.halfLength, 2.2),
  ...riverBanks(),
  ...TREES.filter((t) => Math.hypot(t.x, t.z) < WORLD.rideRadius + 4).map((t) =>
    cyl(t.x, t.z, t.kind === "palm" ? 0.28 : 0.4 * t.scale, 3),
  ),
];
