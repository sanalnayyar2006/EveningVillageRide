import { Color, Matrix4 } from "three";
import { GeometryBatch } from "@/game/world/batch";
import { heightAt } from "@/game/world/terrain";
import type { Agent } from "./brain";
import { joint, PartSet, root } from "./rig";

export type AnimalActivity = "stand" | "walk" | "run" | "graze" | "lie" | "bark" | "sit";
export type Species = "cow" | "goat" | "dog";

export type Animal = Agent<AnimalActivity> & {
  species: Species;
  coat: string;
  /** Extra head turn, e.g. towards a passing bike. */
  headYaw: number;
};

/** Body proportions in metres. */
interface Build {
  length: number;
  depth: number;
  width: number;
  legLength: number;
  legRadius: number;
  tailLength: number;
}

const BUILDS: Record<Species, Build> = {
  cow: {
    length: 1.7,
    depth: 0.72,
    width: 0.6,
    legLength: 0.78,
    legRadius: 0.065,
    tailLength: 0.75,
  },
  goat: {
    length: 0.78,
    depth: 0.36,
    width: 0.3,
    legLength: 0.42,
    legRadius: 0.03,
    tailLength: 0.12,
  },
  dog: {
    length: 0.72,
    depth: 0.27,
    width: 0.22,
    legLength: 0.33,
    legRadius: 0.032,
    tailLength: 0.3,
  },
};

const WHITE = "#ffffff";
const DARK = "#2e2622";
const HORN = "#d8cfbd";

function shape(build: (b: GeometryBatch) => void) {
  const batch = new GeometryBatch();
  build(batch);
  return batch.build()!;
}

function bodyShape(species: Species, { length, depth, width }: Build) {
  return shape((b) => {
    b.sphere(1, [0, 0, 0], WHITE, [width / 2, depth / 2, length / 2]);
    if (species === "cow") {
      // The hump and dewlap of the Indian zebu.
      b.sphere(1, [0, depth * 0.45, length * 0.3], WHITE, [0.17, 0.2, 0.22]);
      b.box([0.08, 0.3, 0.4], [0, -depth * 0.35, length * 0.38], WHITE);
    }
  });
}

/** Heads are built pointing forward (+Z) from the neck joint. */
function headShape(species: Species) {
  return shape((b) => {
    if (species === "cow") {
      b.cylinder(0.14, 0.18, 0.35, [0, 0, 0.12], WHITE, 8, [Math.PI / 2 - 0.5, 0, 0]);
      b.sphere(1, [0, -0.12, 0.38], WHITE, [0.13, 0.15, 0.24]);
      b.sphere(1, [0, -0.2, 0.56], DARK, [0.09, 0.07, 0.07]);
      for (const side of [-1, 1]) {
        b.cone(0.035, 0.28, [side * 0.12, 0.05, 0.33], HORN, 6, [0, 0, -side * 0.55]);
        b.sphere(1, [side * 0.16, -0.06, 0.3], WHITE, [0.09, 0.035, 0.05]);
      }
    } else if (species === "goat") {
      b.sphere(1, [0, -0.02, 0.14], WHITE, [0.07, 0.08, 0.13]);
      b.sphere(1, [0, -0.08, 0.25], DARK, [0.04, 0.04, 0.04]);
      b.cone(0.012, 0.08, [0, -0.15, 0.2], WHITE, 5, [Math.PI, 0, 0]);
      for (const side of [-1, 1]) {
        b.cone(0.016, 0.14, [side * 0.04, 0.08, 0.08], HORN, 5, [-0.7, 0, -side * 0.3]);
        b.sphere(1, [side * 0.08, 0.0, 0.08], WHITE, [0.06, 0.02, 0.03]);
      }
    } else {
      b.sphere(1, [0, 0.02, 0.06], WHITE, [0.08, 0.08, 0.09]);
      b.sphere(1, [0, -0.02, 0.15], WHITE, [0.045, 0.045, 0.07]);
      b.sphere(0.022, [0, -0.01, 0.22], DARK);
      for (const side of [-1, 1]) {
        b.cone(0.035, 0.08, [side * 0.05, 0.1, 0.03], WHITE, 4, [0, 0, -side * 0.25]);
      }
    }
  });
}

function legShape({ legLength, legRadius }: Build) {
  return shape((b) => {
    b.cylinder(legRadius * 0.8, legRadius, legLength, [0, -legLength / 2, 0], WHITE, 6);
    b.cylinder(legRadius * 0.9, legRadius * 0.9, 0.05, [0, -legLength + 0.02, 0], DARK, 6);
  });
}

function tailShape(species: Species, { tailLength }: Build) {
  return shape((b) => {
    b.cylinder(0.012, 0.02, tailLength, [0, -tailLength / 2, 0], WHITE, 4);
    if (species === "cow") b.sphere(1, [0, -tailLength, 0], DARK, [0.04, 0.08, 0.04]);
  });
}

export function createAnimalParts(species: Species, capacity: number) {
  const build = BUILDS[species];
  return new PartSet({
    body: { capacity, geometry: bodyShape(species, build) },
    head: { capacity, geometry: headShape(species) },
    leg: { capacity: capacity * 4, geometry: legShape(build) },
    tail: { capacity, geometry: tailShape(species, build) },
  });
}

export type AnimalParts = ReturnType<typeof createAnimalParts>;

interface Pose {
  /** Lowers the whole animal, e.g. lying down. */
  drop: number;
  bodyPitch: number;
  headPitch: number;
  front: [number, number];
  back: [number, number];
  tail: number;
}

const pose: Pose = { drop: 0, bodyPitch: 0, headPitch: 0, front: [0, 0], back: [0, 0], tail: 0 };

function computePose(animal: Animal, clock: number) {
  const build = BUILDS[animal.species];
  const t = animal.activityTime;
  const swish = Math.sin(clock * 2.1 + animal.x * 3) * 0.3;
  Object.assign(pose, {
    drop: 0,
    bodyPitch: 0,
    headPitch: 0.1 + Math.sin(clock * 0.9 + animal.z) * 0.05,
    front: [0, 0],
    back: [0, 0],
    tail: 0.25 + swish,
  });
  const stride = animal.stride * (animal.species === "cow" ? 3.2 : 6);

  switch (animal.activity) {
    case "walk": {
      const swing = Math.sin(stride) * 0.38;
      pose.front = [swing, -swing];
      pose.back = [-swing, swing];
      break;
    }
    case "run": {
      // A bounding gallop: front legs together, back legs together.
      const swing = Math.sin(stride) * 0.8;
      pose.front = [swing, swing * 0.8];
      pose.back = [-swing, -swing * 0.8];
      pose.bodyPitch = Math.sin(stride) * 0.08;
      pose.tail = 1.6;
      break;
    }
    case "graze":
      pose.headPitch = 1.05 + Math.sin(t * 3) * 0.06;
      break;
    case "lie":
      pose.drop = build.legLength * 0.85;
      pose.front = [-1.5, -1.5];
      pose.back = [-1.45, -1.45];
      pose.headPitch = animal.species === "dog" ? 0.45 : 0.2;
      pose.tail = 1.3;
      break;
    case "sit":
      pose.bodyPitch = -0.45;
      pose.back = [-1.3, -1.3];
      pose.drop = build.legLength * 0.35;
      pose.tail = 1.4;
      break;
    case "bark":
      pose.headPitch = -0.25 + Math.abs(Math.sin(t * 9)) * -0.15;
      pose.tail = 2.4 + swish;
      break;
    case "stand":
      break;
  }
  // Dogs carry their tail curled up over the back (a tail hanging down points along -Y,
  // so ~2.4 rad swings it back and up), wagging faster than a cow swishes.
  if (animal.species === "dog" && animal.activity !== "lie" && animal.activity !== "run") {
    pose.tail = 2.4 + Math.sin(clock * 9 + animal.x) * 0.35;
  }
}

const tint = new Color();
const rootM = new Matrix4();
const bodyM = new Matrix4();
const partM = new Matrix4();

/** Pose an animal and write its parts. */
export function drawAnimal(parts: AnimalParts, animal: Animal, clock: number) {
  computePose(animal, clock);
  const build = BUILDS[animal.species];
  const { length, depth, width, legLength } = build;
  tint.set(animal.coat);
  const ground = heightAt(animal.x, animal.z);
  root(rootM, animal.x, ground - pose.drop, animal.z, animal.heading);

  const bodyY = legLength + depth * 0.35;
  joint(bodyM, rootM, 0, bodyY, 0, pose.bodyPitch);
  parts.place("body", bodyM, tint);

  joint(partM, bodyM, 0, depth * 0.3, length * 0.45, pose.headPitch, animal.headYaw);
  parts.place("head", partM, tint);

  joint(partM, bodyM, 0, depth * 0.25, -length * 0.48, pose.tail);
  parts.place("tail", partM, tint);

  const legTop = legLength + 0.02;
  for (const [z, swings] of [
    [length * 0.33, pose.front],
    [-length * 0.33, pose.back],
  ] as const) {
    for (const [i, side] of [1, -1].entries()) {
      joint(partM, rootM, side * width * 0.28, legTop, z, -swings[i]!);
      parts.place("leg", partM, tint);
    }
  }
}
