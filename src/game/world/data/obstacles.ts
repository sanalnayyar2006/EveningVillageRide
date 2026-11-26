import { localToWorld } from "./geometry";
import { HOUSES, POND, STREAM, WORLD } from "./layout";
import {
  BANYAN,
  BULLOCK_CART,
  BUS_STOP,
  GATE,
  HAYSTACKS,
  HOSPITAL,
  MARKET_STALLS,
  SCHOOL,
  STALL_SIZE,
  SUBSTATION,
  TEA_STALL,
  TEMPLE,
  TEMPLE_BELL,
  WATER_TANK,
  WELL,
  type Placement,
} from "./structures";
import { TREES } from "./vegetation";

/**
 * A solid footprint on the ground. `hx`/`hz` are half-extents, `h` is the full
 * height. Invisible obstacles (stream banks, pond edge) block the bike but not the camera.
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

/** A box offset from a placement in its local space (e.g. a gate pillar). */
function localBox(p: Placement, lx: number, lz: number, hx: number, hz: number, h: number) {
  const [x, z] = localToWorld(p.x, p.z, p.rot, lx, lz);
  return box(x, z, hx, hz, h, p.rot);
}

/** Invisible walls along the stream, so the bike stops on the bank instead of rolling in. */
function streamBanks(): Obstacle[] {
  const out: Obstacle[] = [];
  const points = STREAM.points;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i]!;
    const [bx, bz] = points[i + 1]!;
    const length = Math.hypot(bx - ax, bz - az);
    // A box along each straight run: local Z follows the stream, local X spans the bed.
    const rot = Math.atan2(bx - ax, bz - az);
    out.push(
      invisible(
        box((ax + bx) / 2, (az + bz) / 2, STREAM.bedHalfWidth - 1.5, length / 2 + 1, 4, rot),
      ),
    );
  }
  return out;
}

/** The substation fence, as four thin walls. */
function substationFence(): Obstacle[] {
  const { w, d } = SUBSTATION;
  return [
    localBox(SUBSTATION, 0, -d / 2, w / 2, 0.1, 2.4),
    localBox(SUBSTATION, 0, d / 2, w / 2, 0.1, 2.4),
    localBox(SUBSTATION, -w / 2, 0, 0.1, d / 2, 2.4),
    localBox(SUBSTATION, w / 2, 0, 0.1, d / 2, 2.4),
  ];
}

const inRideArea = (x: number, z: number) => {
  const { minX, maxX, minZ, maxZ } = WORLD.rideBounds;
  return x > minX - 4 && x < maxX + 4 && z > minZ - 4 && z < maxZ + 4;
};

/** Everything the bike can bump into, including every tree trunk inside the ride area. */
export const OBSTACLES: Obstacle[] = [
  ...HOUSES.map((h) => box(h.x, h.z, h.w / 2, h.d / 2, h.h * (h.floors ?? 1), h.rot)),
  localBox(GATE, -GATE.halfSpan, 0, GATE.pillar / 2, GATE.pillar / 2, GATE.height),
  localBox(GATE, GATE.halfSpan, 0, GATE.pillar / 2, GATE.pillar / 2, GATE.height),
  localBox(BUS_STOP, 0, -BUS_STOP.depth / 2, BUS_STOP.length / 2, 0.2, BUS_STOP.height),
  cyl(BANYAN.x, BANYAN.z, BANYAN.platformRadius, 2),
  cyl(WELL.x, WELL.z, WELL.radius, 1),
  box(TEA_STALL.x, TEA_STALL.z, TEA_STALL.w / 2, TEA_STALL.d / 2, TEA_STALL.h, TEA_STALL.rot),
  ...MARKET_STALLS.map((s) => box(s.x, s.z, STALL_SIZE.w / 2, STALL_SIZE.d / 2, 2.4, s.rot)),
  box(TEMPLE.x, TEMPLE.z, TEMPLE.plinth.w / 2, TEMPLE.plinth.d / 2, TEMPLE.spireHeight, TEMPLE.rot),
  localBox(TEMPLE_BELL, -1.2, 0, 0.2, 0.2, 3),
  localBox(TEMPLE_BELL, 1.2, 0, 0.2, 0.2, 3),
  // The school's veranda adds 2.2 m on its front side.
  localBox(SCHOOL, 0, 1.1, SCHOOL.w / 2, SCHOOL.d / 2 + 1.1, SCHOOL.h),
  box(
    HOSPITAL.x,
    HOSPITAL.z,
    HOSPITAL.w / 2,
    HOSPITAL.d / 2,
    HOSPITAL.floorHeight * 2,
    HOSPITAL.rot,
  ),
  ...[-1, 1].flatMap((sx) =>
    [-1, 1].map((sz) => {
      const [x, z] = localToWorld(
        WATER_TANK.x,
        WATER_TANK.z,
        WATER_TANK.rot,
        sx * WATER_TANK.legSpread,
        sz * WATER_TANK.legSpread,
      );
      return cyl(x, z, 0.3, 11);
    }),
  ),
  ...substationFence(),
  ...HAYSTACKS.map((h) => cyl(h.x, h.z, h.r * 0.95, 2.4)),
  box(BULLOCK_CART.x, BULLOCK_CART.z, 1.1, 2.2, 1.4, BULLOCK_CART.rot),
  // Wide enough that the bike stops at the top of the pond's sloping edge.
  invisible(cyl(POND.x, POND.z, POND.radius + 1.2, 3)),
  ...streamBanks(),
  ...TREES.filter((t) => inRideArea(t.x, t.z)).map((t) => cyl(t.x, t.z, 0.4 * t.scale, 3)),
];
