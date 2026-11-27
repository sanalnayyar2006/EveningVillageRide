import { Color, Matrix4, SphereGeometry, TorusGeometry } from "three";
import { clamp, smoothstep } from "@/utils/math";
import { GeometryBatch } from "@/game/world/batch";
import { heightAt } from "@/game/world/terrain";
import type { Agent } from "./brain";
import { joint, PartSet, root } from "./rig";

export type HumanActivity =
  | "stand"
  | "walk"
  | "run"
  | "sit"
  | "work"
  | "bowl"
  | "bat"
  | "crouch"
  | "pour"
  | "sip"
  | "kite"
  | "carry"
  | "wave"
  | "chat"
  | "cycle";

export type Accessory = "hoe" | "bat" | "stick" | "pot";

export interface Look {
  /** 1 for an adult, about 0.65 for a child. */
  scale: number;
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  /** A long skirt or salwar-kameez hem, for women and girls. */
  skirt?: string;
  /** A Himachali topi. */
  cap?: string;
  accessory?: Accessory;
  /** Frame colour of the bicycle they ride everywhere, if they have one. */
  bicycle?: string;
}

export type Villager = Agent<HumanActivity> & {
  look: Look;
  /** Extra head turn, e.g. to watch the bike go by. */
  headYaw: number;
};

// Body measurements at scale 1, in metres.
const HIP_HEIGHT = 0.92;
const LEG_LENGTH = 0.86;
const TORSO_LENGTH = 0.58;
const SHOULDER_Y = 0.52;
const SHOULDER_X = 0.2;
const HIP_X = 0.09;
const ARM_LENGTH = 0.6;

const WHITE = "#ffffff";

// A bicycle sized for the rider, built along +Z with the saddle over the hips.
const WHEEL_RADIUS = 0.36;
const REAR_AXLE: [number, number, number] = [0, WHEEL_RADIUS, -0.45];
const FRONT_AXLE: [number, number, number] = [0, WHEEL_RADIUS, 0.62];
const BOTTOM_BRACKET: [number, number, number] = [0, 0.22, 0.18];
const SADDLE_HEIGHT = 0.98;
/** Wheel turns per crank turn. */
const GEARING = 2;

function shape(build: (b: GeometryBatch) => void) {
  const batch = new GeometryBatch();
  build(batch);
  return batch.build()!;
}

/** Part shapes, all white so each instance's colour paints them. */
function humanParts(capacity: number) {
  return {
    torso: {
      capacity,
      geometry: shape((b) =>
        b.cylinder(0.17, 0.19, TORSO_LENGTH, [0, TORSO_LENGTH / 2, 0], WHITE, 10),
      ),
    },
    head: {
      capacity,
      geometry: shape((b) => {
        b.cylinder(0.045, 0.05, 0.1, [0, 0.05, 0], WHITE, 8);
        b.sphere(0.105, [0, 0.18, 0], WHITE, [1, 1.08, 1]);
        b.sphere(0.017, [0, 0.165, 0.1], WHITE, [1.1, 1.5, 1]);
      }),
    },
    hair: {
      noShadow: true,
      capacity,
      // The top half of a sphere, sitting over the crown.
      geometry: shape((b) =>
        b.add(
          new SphereGeometry(0.112, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
          [0, 0.2, -0.01],
          WHITE,
        ),
      ),
    },
    cap: {
      noShadow: true,
      capacity,
      geometry: shape((b) => {
        b.cylinder(0.105, 0.11, 0.1, [0, 0.29, -0.01], WHITE, 12);
        b.cylinder(0.112, 0.112, 0.035, [0, 0.25, -0.01], "#e8cf7a", 12);
      }),
    },
    arm: {
      capacity: capacity * 2,
      geometry: shape((b) =>
        b.cylinder(0.042, 0.048, ARM_LENGTH, [0, -ARM_LENGTH / 2, 0], WHITE, 7),
      ),
    },
    hand: {
      noShadow: true,
      capacity: capacity * 2,
      geometry: shape((b) => b.sphere(0.045, [0, 0, 0], WHITE)),
    },
    leg: {
      capacity: capacity * 2,
      geometry: shape((b) => {
        b.cylinder(0.05, 0.066, LEG_LENGTH, [0, -LEG_LENGTH / 2, 0], WHITE, 7);
        b.box([0.09, 0.05, 0.22], [0, -LEG_LENGTH - 0.03, 0.04], "#3a2a20");
      }),
    },
    skirt: {
      capacity,
      geometry: shape((b) => b.cylinder(0.19, 0.27, 0.82, [0, -0.41, 0], WHITE, 12)),
    },
    pot: {
      noShadow: true,
      capacity,
      geometry: shape((b) => {
        b.sphere(0.15, [0, 0.36, 0], WHITE, [1, 0.85, 1]);
        b.cylinder(0.07, 0.09, 0.08, [0, 0.5, 0], WHITE, 10);
      }),
    },
    hoe: {
      noShadow: true,
      capacity,
      geometry: shape((b) => {
        b.cylinder(0.018, 0.018, 1.1, [0, -0.55, 0], "#8a6440", 5);
        b.box([0.18, 0.03, 0.14], [0, -1.1, 0.06], "#5e5e5e");
      }),
    },
    bat: {
      noShadow: true,
      capacity,
      geometry: shape((b) => {
        b.cylinder(0.018, 0.018, 0.28, [0, -0.14, 0], "#3a2a20", 5);
        b.box([0.1, 0.55, 0.035], [0, -0.55, 0], "#e6cf9a");
      }),
    },
    bicycle: {
      capacity,
      geometry: shape((b) => {
        const seat: [number, number, number] = [0, 0.88, -0.02];
        const head: [number, number, number] = [0, 0.98, 0.55];
        b.beam(BOTTOM_BRACKET, seat, 0.035, WHITE);
        b.beam(seat, head, 0.035, WHITE);
        b.beam(BOTTOM_BRACKET, head, 0.04, WHITE);
        b.beam(BOTTOM_BRACKET, REAR_AXLE, 0.025, WHITE);
        b.beam(seat, REAR_AXLE, 0.025, WHITE);
        b.beam([0, 1.08, 0.53], FRONT_AXLE, 0.03, WHITE);
        b.beam([-0.24, 1.1, 0.56], [0.24, 1.1, 0.56], 0.025, "#2b2b2b");
        b.box([0.12, 0.05, 0.24], [0, SADDLE_HEIGHT - 0.06, -0.04], "#2b2420");
        b.cylinder(0.09, 0.09, 0.03, BOTTOM_BRACKET, "#2b2b2b", 10, [0, 0, Math.PI / 2]);
      }),
    },
    wheel: {
      noShadow: true,
      capacity: capacity * 2,
      geometry: shape((b) => {
        b.add(new TorusGeometry(WHEEL_RADIUS - 0.02, 0.022, 6, 20), [0, 0, 0], "#1e1e1e", [
          0,
          Math.PI / 2,
          0,
        ]);
        // Two crossed spokes, so the turning shows.
        b.box([0.012, WHEEL_RADIUS * 2 - 0.04, 0.012], [0, 0, 0], "#9a9a9a");
        b.box([0.012, 0.012, WHEEL_RADIUS * 2 - 0.04], [0, 0, 0], "#9a9a9a");
      }),
    },
    stick: {
      noShadow: true,
      capacity,
      geometry: shape((b) => b.cylinder(0.016, 0.02, 1.5, [0, -0.75, 0], "#7a5a38", 5)),
    },
  };
}

export type HumanPart = keyof ReturnType<typeof humanParts>;

export const createHumanParts = (capacity: number) => new PartSet(humanParts(capacity));

/** Joint angles for one frame. Angles in radians; negative arm/leg X swings forward. */
interface Pose {
  hipY: number;
  torsoPitch: number;
  headPitch: number;
  legL: number;
  legR: number;
  armL: number;
  armR: number;
  armOutL: number;
  armOutR: number;
  /** Tool angle relative to the right forearm. */
  tool: number;
}

const pose: Pose = {
  hipY: HIP_HEIGHT,
  torsoPitch: 0,
  headPitch: 0,
  legL: 0,
  legR: 0,
  armL: 0,
  armR: 0,
  armOutL: 0.08,
  armOutR: -0.08,
  tool: -1.2,
};

function resetPose() {
  Object.assign(pose, {
    hipY: HIP_HEIGHT,
    torsoPitch: 0.02,
    headPitch: 0,
    legL: 0,
    legR: 0,
    armL: 0,
    armR: 0,
    armOutL: 0.08,
    armOutR: -0.08,
    tool: -1.2,
  });
}

function walkCycle(stride: number, amplitude: number) {
  const swing = Math.sin(stride * 4.2);
  pose.legL = -swing * amplitude;
  pose.legR = swing * amplitude;
  pose.armL = swing * amplitude * 0.8;
  pose.armR = -swing * amplitude * 0.8;
}

/** Fill `pose` for an activity. `t` is seconds into the activity; `clock` is global time. */
function computePose(villager: Villager, clock: number) {
  resetPose();
  const t = villager.activityTime;
  const breathe = Math.sin(clock * 1.4 + villager.x) * 0.02;
  pose.torsoPitch += breathe;

  switch (villager.activity) {
    case "walk":
      walkCycle(villager.stride, 0.42);
      break;
    case "run":
      walkCycle(villager.stride * 0.8, 0.85);
      pose.torsoPitch = 0.18;
      pose.armL -= 0.35;
      pose.armR -= 0.35;
      break;
    case "carry":
      walkCycle(villager.stride, villager.speed > 0 ? 0.38 : 0);
      // Left hand steadies the pot on the head.
      pose.armL = -2.75;
      pose.armOutL = 0.35;
      break;
    case "sit":
    case "sip":
      pose.hipY = 0.47;
      pose.legL = pose.legR = -1.48;
      pose.armL = pose.armR = -0.55;
      if (villager.activity === "sip") {
        pose.armR = -0.55 - 1.25 * Math.max(0, Math.sin(clock * 0.7 + villager.z)) ** 6;
      }
      break;
    case "work": {
      const chop = Math.sin(t * 2.4);
      pose.torsoPitch = 0.55 + chop * 0.12;
      pose.armL = pose.armR = -1.05 + chop * 0.55;
      pose.legL = -0.18;
      pose.legR = 0.12;
      pose.tool = -1.0 - chop * 0.25;
      pose.headPitch = 0.2;
      break;
    }
    case "bowl": {
      const wind = smoothstep(0.1, 0.7, t);
      pose.armR = -wind * Math.PI * 2;
      pose.torsoPitch = 0.1 + Math.sin(wind * Math.PI) * 0.35;
      pose.legL = -0.35;
      pose.legR = 0.25;
      break;
    }
    case "bat": {
      // Ready stance, then a swing half a second after the ball is bowled.
      const swing = Math.sin(Math.PI * clamp((t - 0.55) / 0.35, 0, 1));
      pose.torsoPitch = 0.32;
      pose.armL = pose.armR = -0.7 - swing * 1.3;
      pose.armOutL = -0.35;
      pose.armOutR = 0.25;
      pose.legL = -0.2;
      pose.legR = 0.2;
      pose.tool = -0.6 + swing * 0.9;
      break;
    }
    case "crouch":
      pose.hipY = 0.58;
      pose.legL = pose.legR = -1.05;
      pose.torsoPitch = 0.55;
      pose.armL = pose.armR = -1.1;
      pose.headPitch = -0.45;
      break;
    case "pour":
      pose.armR = -1.25 + Math.sin(t * 1.6) * 0.45;
      pose.armL = -0.7;
      pose.torsoPitch = 0.12;
      pose.headPitch = 0.25;
      break;
    case "kite": {
      const tug = Math.sin(clock * 2.2 + villager.x) * 0.15;
      pose.armL = -1.9 + tug;
      pose.armR = -1.4 - tug;
      pose.headPitch = -0.55;
      break;
    }
    case "wave":
      pose.armR = -2.7;
      pose.armOutR = -0.3 + Math.sin(t * 9) * 0.35;
      pose.headPitch = -0.05;
      break;
    case "chat":
      pose.armR = -0.45 + Math.sin(t * 2.3) * 0.25;
      pose.armL = -0.15 + Math.sin(t * 1.7 + 1) * 0.15;
      break;
    case "cycle": {
      // Straight legs round the cranks, leaning over the bars.
      const crank = Math.sin(villager.stride / (WHEEL_RADIUS * villager.look.scale * GEARING));
      pose.hipY = SADDLE_HEIGHT;
      pose.torsoPitch = 0.32;
      pose.headPitch = -0.25;
      pose.legL = -0.3 + crank * 0.32;
      pose.legR = -0.3 - crank * 0.32;
      pose.armL = pose.armR = -0.75;
      pose.armOutL = 0.12;
      pose.armOutR = -0.12;
      break;
    }
    case "stand":
      break;
  }

  // Stopped on a bicycle: off the saddle, astride the frame, both feet down.
  if (villager.look.bicycle && villager.activity !== "cycle") {
    pose.hipY = LEG_LENGTH + 0.04;
    pose.armL = pose.armR = -0.6;
    pose.legL = 0.08;
    pose.legR = -0.08;
  }

  // Farmers carry their hoe over the shoulder when walking.
  if (villager.look.accessory === "hoe" && villager.activity === "walk") {
    pose.armR = -2.4;
    pose.tool = 2.6;
  }
}

const tint = new Color();
const rootM = new Matrix4();
const hips = new Matrix4();
const torsoM = new Matrix4();
const headM = new Matrix4();
const armM = new Matrix4();
const handM = new Matrix4();
const legM = new Matrix4();
const toolM = new Matrix4();
const wheelM = new Matrix4();

const paint = (colour: string) => tint.set(colour);

/** Pose a villager and write all of its parts into the part set. */
export function drawVillager(parts: PartSet<HumanPart>, villager: Villager, clock: number) {
  computePose(villager, clock);
  const { look } = villager;
  const ground = heightAt(villager.x, villager.z);
  root(rootM, villager.x, ground, villager.z, villager.heading, look.scale);

  joint(hips, rootM, 0, pose.hipY, 0, pose.torsoPitch);
  joint(torsoM, hips, 0, 0, 0);
  parts.place("torso", torsoM, paint(look.shirt));

  joint(headM, hips, 0, TORSO_LENGTH, 0, pose.headPitch, villager.headYaw);
  parts.place("head", headM, paint(look.skin));
  parts.place("hair", headM, paint(look.hair));
  if (look.cap) parts.place("cap", headM, paint(look.cap));
  if (look.accessory === "pot") parts.place("pot", headM, paint("#c9973e"));

  for (const side of [1, -1] as const) {
    const swing = side === 1 ? pose.armL : pose.armR;
    const out = side === 1 ? pose.armOutL : pose.armOutR;
    joint(armM, hips, side * SHOULDER_X, SHOULDER_Y, 0, swing, 0, out);
    parts.place("arm", armM, paint(look.shirt));
    joint(handM, armM, 0, -ARM_LENGTH - 0.02, 0);
    parts.place("hand", handM, paint(look.skin));

    const tool = look.accessory;
    if (side === -1 && (tool === "hoe" || tool === "bat" || tool === "stick")) {
      joint(toolM, handM, 0, 0, 0, tool === "stick" ? 0.3 : pose.tool);
      parts.place(tool, toolM, paint("#ffffff"));
    }
  }

  // Legs hang from the root, not the hips, so leaning forward doesn't tilt them.
  for (const side of [1, -1] as const) {
    joint(legM, rootM, side * HIP_X, pose.hipY, 0, side === 1 ? pose.legL : pose.legR);
    parts.place("leg", legM, paint(look.pants));
  }
  if (look.skirt) {
    joint(legM, rootM, 0, pose.hipY + 0.05, 0, (pose.legL + pose.legR) * 0.25);
    parts.place("skirt", legM, paint(look.skirt));
  }

  if (look.bicycle) {
    parts.place("bicycle", rootM, paint(look.bicycle));
    const spin = villager.stride / (WHEEL_RADIUS * look.scale);
    for (const axle of [REAR_AXLE, FRONT_AXLE]) {
      joint(wheelM, rootM, axle[0], axle[1], axle[2], spin);
      parts.place("wheel", wheelM, paint("#ffffff"));
    }
  }
}
