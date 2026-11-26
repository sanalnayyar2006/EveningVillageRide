import type { Vec3Tuple } from "@/types/game";
import { FIELDS, POND } from "./layout";
import { px } from "./mapSource";
import { boundsOf } from "./geometry";
import {
  BANYAN,
  BUS_STOP,
  GATE,
  HOSPITAL,
  MARKET_STALLS,
  SCHOOL,
  SUBSTATION,
  TEA_STALL,
  TEMPLE,
  WATER_TANK,
} from "./structures";

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
  | "hospital"
  | "substation"
  | "highway"
  | "terraces"
  | "orchards";

/** A named place in the village. Photos are labelled with these. */
export interface Landmark {
  id: LandmarkId;
  name: string;
  /** One line shown when the place is first discovered. */
  blurb: string;
  position: Vec3Tuple;
  /** How close (m) the player must be to count as "at" this place. */
  radius: number;
}

const on = (p: { x: number; z: number }): Vec3Tuple => [p.x, 0, p.z];
const atPixel = (u: number, v: number): Vec3Tuple => {
  const [x, z] = px(u, v);
  return [x, 0, z];
};
const fieldCentre = (id: string): Vec3Tuple => {
  const field = FIELDS.find((f) => f.id === id)!;
  const b = boundsOf(field.polygon);
  return [(b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2];
};
const middleStall = MARKET_STALLS[Math.floor(MARKET_STALLS.length / 2)]!;

// Smaller places are listed first: where two overlap, the nearest centre wins anyway.
export const LANDMARKS: Landmark[] = [
  {
    id: "entrance",
    name: "Village Gate",
    blurb: "The road home leaves the highway here and climbs into the village.",
    position: on(GATE),
    radius: 12,
  },
  {
    id: "busStop",
    name: "Bus Stop",
    blurb: "The Pathankot bus left an hour ago. Nobody minds.",
    position: on(BUS_STOP),
    radius: 8,
  },
  {
    id: "teaStall",
    name: "Ramu's Tea Stall",
    blurb: "Cutting chai, ten rupees, and all the village news.",
    position: on(TEA_STALL),
    radius: 9,
  },
  {
    id: "market",
    name: "Highway Bazaar",
    blurb: "Apples, marigolds and a lot of friendly bargaining by the roadside.",
    position: on(middleStall),
    radius: 18,
  },
  {
    id: "banyan",
    name: "Old Banyan Tree",
    blurb: "Older than anyone's grandparents can remember.",
    position: on(BANYAN),
    radius: 14,
  },
  {
    id: "temple",
    name: "Hill Temple",
    blurb: "Ring the bell on your way past. Everyone does.",
    position: on(TEMPLE),
    radius: 16,
  },
  {
    id: "hospital",
    name: "Sri Sai Hospital",
    blurb: "The busiest building in the village, even at dusk.",
    position: on(HOSPITAL),
    radius: 14,
  },
  {
    id: "pond",
    name: "Village Pond",
    blurb: "Still water, buffaloes nearby and the first fireflies.",
    position: on(POND),
    radius: 16,
  },
  {
    id: "school",
    name: "Village School",
    blurb: "School's out. The cricket match is not.",
    position: on(SCHOOL),
    radius: 26,
  },
  {
    id: "waterTank",
    name: "Water Tank",
    blurb: "The tallest thing for miles. Kids dare each other to climb it.",
    position: on(WATER_TANK),
    radius: 10,
  },
  {
    id: "substation",
    name: "Power Substation",
    blurb: "It hums all evening, like a giant beehive.",
    position: on(SUBSTATION),
    radius: 45,
  },
  {
    id: "terraces",
    name: "Terraced Fields",
    blurb: "Step after step of wheat, cut into the hillside by hand.",
    position: fieldCentre("middle terraces"),
    radius: 40,
  },
  {
    id: "orchards",
    name: "East Orchards",
    blurb: "Rows of fruit trees glowing in the last of the sun.",
    position: fieldCentre("east orchard"),
    radius: 45,
  },
  {
    id: "highway",
    name: "NH154",
    blurb: "Trucks to Dharamshala rumble past, then the quiet comes back.",
    position: atPixel(800, 716),
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
