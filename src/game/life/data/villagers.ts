import { localToWorld } from "@/game/world/data/geometry";
import { px, pxPath, type Point } from "@/game/world/data/mapSource";
import {
  BENCHES,
  BUS_STOP,
  HAND_PUMP,
  MARKET_STALLS,
  TEA_STALL,
  type Placement,
} from "@/game/world/data/structures";
import { createAgent, type Task } from "../brain";
import type { HumanActivity, Look, Villager } from "../human";

// Who lives in the village and what they do all evening. Routes are traced
// in screenshot pixels along the real lanes, like the rest of the map.

const SKIN = ["#8d5a3b", "#a0694a", "#7a4a30", "#b07a55"];
const BLACK_HAIR = "#1c1410";
const GREY_HAIR = "#a8a29a";
const CAP_MAROON = "#7a1f2b";
const CAP_GREEN = "#2f5d3a";

const man = (shirt: string, pants: string, skin = 0, extra: Partial<Look> = {}): Look => ({
  scale: 1,
  skin: SKIN[skin]!,
  hair: BLACK_HAIR,
  shirt,
  pants,
  ...extra,
});
const woman = (shirt: string, skirt: string, skin = 1, extra: Partial<Look> = {}): Look => ({
  scale: 0.95,
  skin: SKIN[skin]!,
  hair: BLACK_HAIR,
  shirt,
  pants: skirt,
  skirt,
  ...extra,
});
const child = (look: Look, scale = 0.68): Look => ({ ...look, scale });

type Script = Task<HumanActivity>[];

const walk = (
  path: Point[],
  speed = 1.1,
  activity: HumanActivity = "walk",
): Task<HumanActivity> => ({
  kind: "walk",
  path,
  speed,
  activity,
});
const stay = (seconds: number, activity: HumanActivity, facing?: number): Task<HumanActivity> => ({
  kind: "stay",
  seconds,
  activity,
  facing,
});

/** There and back along a route, pausing at each end. */
function pingPong(path: Point[], pause: number, speed = 1.1, rest: HumanActivity = "chat"): Script {
  return [
    walk(path, speed),
    stay(pause, rest),
    walk([...path].reverse(), speed),
    stay(pause, rest),
  ];
}

function villager(look: Look, script: Script, start?: Point, heading = 0): Villager {
  const first = script[0];
  const from: Point =
    start ??
    (first?.kind === "walk" ? first.path[0]! : first?.kind === "wander" ? first.centre : [0, 0]);
  const agent = createAgent<HumanActivity>(from, heading, script, "stand");
  return { ...agent, look, headYaw: 0 };
}

/** A spot relative to a landmark, and the heading that faces the same way it does. */
const near = (p: Placement, lx: number, lz: number): Point => localToWorld(p.x, p.z, p.rot, lx, lz);

const TEA_BENCH = BENCHES.find((b) => b.id === "teaBench")!;
const BANYAN_BENCH = BENCHES.find((b) => b.id === "banyanBench")!;
const BUS_FRONT = near(BUS_STOP, 0.5, 0.6);

function bazaarRoles(): Villager[] {
  const keepers = [0, 2, 4].map((i, n) => {
    const stall = MARKET_STALLS[i]!;
    const spot = near(stall, 0, -0.9);
    const look =
      n === 1 ? woman("#d6336c", "#5a2a6e", 2) : man("#e9e2cf", "#efe8d8", n, { cap: CAP_MAROON });
    return villager(
      look,
      [stay(30, "sit", stall.rot), stay(8, "chat", stall.rot)],
      spot,
      stall.rot,
    );
  });
  const shopperA = near(MARKET_STALLS[1]!, 0, 1.6);
  const shopperB = near(MARKET_STALLS[3]!, 0, 1.6);
  const shoppers = [
    villager(
      woman("#f4a261", "#2a9d8f", 0),
      [
        stay(12, "chat", MARKET_STALLS[1]!.rot + Math.PI),
        walk([shopperB]),
        stay(10, "chat", MARKET_STALLS[3]!.rot + Math.PI),
        walk([shopperA]),
      ],
      shopperA,
    ),
    villager(
      man("#5b7db1", "#3a3a3a", 3),
      [
        stay(16, "chat", MARKET_STALLS[3]!.rot + Math.PI),
        walk([shopperA]),
        stay(9, "chat", MARKET_STALLS[1]!.rot + Math.PI),
        walk([shopperB]),
      ],
      shopperB,
    ),
  ];
  return [...keepers, ...shoppers];
}

function teaStallRoles(): Villager[] {
  const behindCounter = near(TEA_STALL, 0, -0.7);
  const seatA = near(TEA_BENCH, 0.45, 0.05);
  const seatB = near(TEA_BENCH, -0.45, 0.05);
  return [
    villager(
      man("#f3ece0", "#efe8d8", 1, { cap: CAP_GREEN }),
      [stay(7, "pour", TEA_STALL.rot), stay(4, "stand", TEA_STALL.rot)],
      behindCounter,
      TEA_STALL.rot,
    ),
    villager(
      man("#8a6a4a", "#efe8d8", 0, { hair: GREY_HAIR, cap: CAP_MAROON }),
      [stay(60, "sip", TEA_BENCH.rot)],
      seatA,
      TEA_BENCH.rot,
    ),
    // Drinks up, wanders over to check for the bus, and comes back.
    villager(
      woman("#3d8b7a", "#e9c46a", 1),
      [
        stay(40, "sip", TEA_BENCH.rot),
        walk([BUS_FRONT], 1),
        stay(18, "stand", BUS_STOP.rot),
        walk([seatB], 1),
      ],
      seatB,
      TEA_BENCH.rot,
    ),
  ];
}

const FARMER_NW_ROUTE = pxPath([
  [246, 300],
  [242, 332],
  [300, 384],
  [398, 418],
  [440, 450],
]);
const FARMER_NE_ROUTE = pxPath([
  [790, 176],
  [795, 120],
  [822, 110],
  [852, 94],
]);
const ELDER_ROUTE = [
  ...pxPath([
    [645, 385],
    [628, 425],
    [652, 482],
  ]),
  near(BANYAN_BENCH, 0, 0.6),
];
const POT_ROUTE = pxPath([
  [742, 644],
  [752, 622],
]);

export function createVillagers(): Villager[] {
  const benchSeat = near(BANYAN_BENCH, 0, 0.05);
  return [
    // Farmers walk out to their terraces, work the soil and come home.
    villager(man("#c9b48a", "#efe8d8", 2, { cap: CAP_MAROON, accessory: "hoe" }), [
      walk(FARMER_NW_ROUTE, 0.9),
      stay(30, "work"),
      walk([...FARMER_NW_ROUTE].reverse(), 0.9),
      stay(10, "stand"),
    ]),
    villager(man("#7f8f5a", "#efe8d8", 3, { accessory: "hoe" }), [
      walk(FARMER_NE_ROUTE, 0.9),
      stay(35, "work"),
      walk([...FARMER_NE_ROUTE].reverse(), 0.9),
      stay(12, "chat"),
    ]),

    ...teaStallRoles(),
    ...bazaarRoles(),

    villager(
      man("#4f6d8f", "#2f2f2f", 1),
      [stay(999, "stand", BUS_STOP.rot)],
      BUS_FRONT,
      BUS_STOP.rot,
    ),

    // An elder walks slowly down to the banyan bench, sits a long while, and goes home.
    villager(
      man("#f3ece0", "#f3ece0", 0, { hair: GREY_HAIR, accessory: "stick", cap: CAP_MAROON }),
      [
        walk(ELDER_ROUTE, 0.55),
        { kind: "walk", path: [benchSeat], speed: 0.4, activity: "walk" },
        stay(45, "sit", BANYAN_BENCH.rot),
        walk([...ELDER_ROUTE].reverse(), 0.55),
        stay(20, "stand"),
      ],
    ),

    // People out for an evening stroll.
    villager(
      woman("#e76f51", "#264653", 2),
      pingPong(
        pxPath([
          [390, 652],
          [470, 662],
          [560, 676],
        ]),
        8,
        0.9,
      ),
    ),
    villager(
      man("#2a6f97", "#d9d2c0", 0),
      pingPong(
        pxPath([
          [712, 660],
          [700, 560],
          [660, 480],
          [630, 425],
          [622, 360],
          [606, 290],
        ]),
        10,
      ),
    ),
    villager(
      man("#9c4a2f", "#efe8d8", 2, { cap: CAP_GREEN }),
      pingPong(
        pxPath([
          [748, 690],
          [760, 560],
          [782, 500],
          [802, 420],
          [810, 330],
          [800, 250],
        ]),
        12,
      ),
    ),
    villager(
      woman("#6a4c93", "#f2c230", 3),
      pingPong(
        pxPath([
          [580, 168],
          [470, 184],
          [400, 174],
          [330, 178],
          [262, 194],
          [200, 218],
        ]),
        9,
        1,
      ),
    ),

    // Fetching water from the hand pump with a brass pot on her head.
    villager(woman("#c0392b", "#f4d35e", 1, { accessory: "pot" }), [
      walk(POT_ROUTE, 0.8, "carry"),
      stay(6, "carry", HAND_PUMP.rot),
      walk([...POT_ROUTE].reverse(), 0.8, "carry"),
      stay(20, "carry"),
    ]),

    // Kids flying kites over the bare terraces below the hospital.
    villager(
      child(man("#f2c230", "#3a5a8a", 1)),
      [stay(999, "kite", Math.PI * 0.85)],
      px(350, 322),
    ),
    villager(
      child(woman("#e8789a", "#5a3a8a", 2)),
      [stay(999, "kite", Math.PI * 0.95)],
      px(432, 300),
    ),

    // The goatherd ambles about the orchard while the goats graze.
    villager(man("#6b4f3a", "#d9d2c0", 2, { cap: CAP_MAROON, accessory: "stick" }), [
      {
        kind: "wander",
        centre: px(862, 466),
        radius: 9,
        seconds: 999,
        speed: 0.5,
        moving: "walk",
        resting: "stand",
      },
    ]),
  ];
}

/** Where the kites fly: above and upwind of the two kite flyers. */
export const KITE_FLYERS = [px(350, 322), px(432, 300)];
