import type { Vec3Tuple } from "@/types/game";

export type LandmarkId =
  | "entrance"
  | "busStop"
  | "banyan"
  | "teaStall"
  | "market"
  | "temple"
  | "pond"
  | "school"
  | "waterTank"
  | "railway"
  | "bridge"
  | "fields";

/** A named place in the village. Phase 3 uses these to label photos. */
export interface Landmark {
  id: LandmarkId;
  name: string;
  /** One line shown when the place is first discovered. */
  blurb: string;
  position: Vec3Tuple;
  /** How close (m) the player must be to count as "at" this place. */
  radius: number;
}

export const LANDMARKS: Landmark[] = [
  {
    id: "entrance",
    name: "Village Gate",
    blurb: "The road home, painted gold by the setting sun.",
    position: [0, 0, 95],
    radius: 12,
  },
  {
    id: "busStop",
    name: "Bus Stop",
    blurb: "The last bus left an hour ago. Nobody minds.",
    position: [9.5, 0, 84],
    radius: 8,
  },
  {
    id: "banyan",
    name: "Old Banyan Tree",
    blurb: "Older than anyone's grandparents can remember.",
    position: [-17, 0, 15],
    radius: 14,
  },
  {
    id: "teaStall",
    name: "Ramu's Tea Stall",
    blurb: "Cutting chai, ten rupees, and all the village news.",
    position: [10, 0, -10],
    radius: 9,
  },
  {
    id: "market",
    name: "Evening Market",
    blurb: "Marigolds, mangoes and a lot of friendly bargaining.",
    position: [32, 0, 0],
    radius: 15,
  },
  {
    id: "temple",
    name: "Hanuman Temple",
    blurb: "The bell can be heard from across the fields.",
    position: [-50, 0, -42],
    radius: 16,
  },
  {
    id: "pond",
    name: "Lotus Pond",
    blurb: "Still water, ducks and the first fireflies.",
    position: [-38, 0, 27],
    radius: 16,
  },
  {
    id: "school",
    name: "Village School",
    blurb: "School's out. The cricket match is not.",
    position: [34, 0, 44],
    radius: 18,
  },
  {
    id: "waterTank",
    name: "Water Tank",
    blurb: "The tallest thing for miles. Kids dare each other to climb it.",
    position: [58, 0, -30],
    radius: 10,
  },
  {
    id: "railway",
    name: "Railway Crossing",
    blurb: "Wait for the evening train. It's worth it.",
    position: [76, 0, 0],
    radius: 12,
  },
  {
    id: "bridge",
    name: "River Bridge",
    blurb: "The best sunset in the village.",
    position: [0, 0, -60],
    radius: 11,
  },
  {
    id: "fields",
    name: "Mustard Fields",
    blurb: "Yellow as far as the eye can see.",
    position: [-4, 0, -92],
    radius: 30,
  },
];

/** The landmark the player is at, if any; the closest wins where two overlap. */
export function landmarkAt(x: number, z: number): Landmark | null {
  let best: Landmark | null = null;
  let bestDistance = Infinity;
  for (const landmark of LANDMARKS) {
    const distance = Math.hypot(x - landmark.position[0], z - landmark.position[2]);
    if (distance <= landmark.radius && distance < bestDistance) {
      best = landmark;
      bestDistance = distance;
    }
  }
  return best;
}
