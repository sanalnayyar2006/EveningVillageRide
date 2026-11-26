import { px, type Point } from "@/game/world/data/mapSource";
import type { Animal, AnimalActivity, Species } from "../animal";
import { createAgent, type Task } from "../brain";

// The village's animals, placed in screenshot pixels. Cows graze and amble,
// one crosses the highway; goats follow the goatherd; dogs doze until a bike goes by.

type Script = Task<AnimalActivity>[];

const graze = (centre: Point, radius: number, seconds = 999): Task<AnimalActivity> => ({
  kind: "wander",
  centre,
  radius,
  seconds,
  speed: 0.45,
  moving: "walk",
  resting: "graze",
});

function animal(
  species: Species,
  coat: string,
  script: Script,
  start?: Point,
  heading = 0,
): Animal {
  const first = script[0];
  const from: Point =
    start ??
    (first?.kind === "wander" ? first.centre : first?.kind === "walk" ? first.path[0]! : [0, 0]);
  const initial: AnimalActivity = species === "dog" ? "lie" : "graze";
  return {
    ...createAgent<AnimalActivity>(from, heading, script, initial),
    species,
    coat,
    headYaw: 0,
  };
}

const NORTH_VERGE = px(800, 694);
const SOUTH_VERGE = px(805, 752);

export function createAnimals(): Animal[] {
  return [
    // Two cows grazing the open ground west of the village.
    animal("cow", "#f1ebe0", [graze(px(330, 455), 9)]),
    animal("cow", "#9a6a44", [graze(px(318, 470), 8)]),
    // One cow that takes her time crossing the highway, back and forth all evening.
    animal("cow", "#e8e0d2", [
      graze(NORTH_VERGE, 3.5, 35),
      { kind: "walk", path: [SOUTH_VERGE], speed: 0.4, activity: "walk" },
      graze(SOUTH_VERGE, 3.5, 35),
      { kind: "walk", path: [NORTH_VERGE], speed: 0.4, activity: "walk" },
    ]),
    // Resting near the banyan, getting up now and then for a mouthful.
    animal(
      "cow",
      "#2e2a28",
      [{ kind: "stay", seconds: 60, activity: "lie" }, graze(px(586, 560), 2.5, 25)],
      px(586, 560),
      1.2,
    ),

    // The goatherd's small flock in the orchard.
    ...["#f4efe6", "#2a2522", "#8a5a3a", "#f4efe6", "#5a4030"].map((coat, i) =>
      animal("goat", coat, [graze(px(858 + (i % 2) * 14, 460 + i * 6), 8)]),
    ),

    // Dogs doze at their usual spots; Animals.tsx wakes them when a bike passes.
    animal("dog", "#c8955a", [{ kind: "stay", seconds: 999, activity: "lie" }], px(666, 642), 2),
    animal("dog", "#2b2523", [{ kind: "stay", seconds: 999, activity: "lie" }], px(520, 694), -1),
    animal("dog", "#a8744a", [{ kind: "stay", seconds: 999, activity: "lie" }], px(960, 600), 0.5),
  ];
}
