// The village layout, in metres. North is -Z, and the village gate is in the south at +Z.
// Rendering, physics and gameplay all read from here, so moving something is a one-line change.

export const WORLD = {
  /** The bike can never leave this radius. */
  rideRadius: 118,
  /** Village ground is perfectly flat inside this radius. */
  flatRadius: 104,
  /** Terrain mesh half-size. */
  extent: 260,
} as const;

export const RIVER = {
  z: -60,
  /** Half-width of the water surface. */
  halfWidth: 5.6,
  /** Half-width of the carved channel including banks. */
  bankHalfWidth: 8,
  depth: 1.5,
  waterY: -0.55,
} as const;

const bend = (x: number) => 3.2 * Math.sin(x * 0.028) + 1.4 * Math.sin(x * 0.071 + 1.3);

/** How far the river bends off its centre line at `x`. Zero at x = 0, so the bridge crosses straight. */
export const riverMeander = (x: number) => bend(x) - bend(0);

export const BRIDGE = {
  x: 0,
  z: RIVER.z,
  halfWidth: 3.6,
  halfLength: 9.5,
  rise: 0.95,
} as const;

export const POND = { x: -38, z: 27, radius: 9.5, waterY: -0.45 } as const;

/** The track runs north–south and leaves the map in both directions. */
export const RAILWAY = { x: 76, halfLength: 320 } as const;

export type RoadSurface = "asphalt" | "dirt";

export interface RoadSegment {
  from: [number, number];
  to: [number, number];
  width: number;
  surface: RoadSurface;
}

export const ROADS: RoadSegment[] = [
  // Main road, entrance → bridge, then bridge → fields.
  { from: [0, 126], to: [0, -50.5], width: 6, surface: "asphalt" },
  { from: [0, -69.5], to: [0, -112], width: 5, surface: "asphalt" },
  // Village cross road, through the market and over the railway.
  { from: [-104, 0], to: [118, 0], width: 5, surface: "asphalt" },
  // Lanes.
  { from: [-50, 0], to: [-50, -30], width: 4, surface: "dirt" },
  { from: [30, 0], to: [30, 33], width: 4, surface: "dirt" },
  { from: [-14, 0], to: [-33, 14], width: 3.2, surface: "dirt" },
  { from: [58, 0], to: [58, -22], width: 3.2, surface: "dirt" },
  // Field paths beyond the river.
  { from: [0, -86], to: [-62, -86], width: 3, surface: "dirt" },
  { from: [0, -86], to: [62, -86], width: 3, surface: "dirt" },
  // West field track.
  { from: [-74, 0], to: [-74, 74], width: 3, surface: "dirt" },
];

export interface FieldPatch {
  id: string;
  min: [number, number];
  max: [number, number];
  crop: "mustard" | "wheat" | "paddy";
}

export const FIELDS: FieldPatch[] = [
  { id: "north-west", min: [-62, -110], max: [-4, -88.5], crop: "mustard" },
  { id: "river-west", min: [-62, -83.5], max: [-6, -71], crop: "wheat" },
  { id: "north-east", min: [4, -110], max: [62, -88.5], crop: "wheat" },
  { id: "river-east", min: [6, -83.5], max: [62, -71], crop: "mustard" },
  { id: "paddy", min: [-104, 14], max: [-77, 74], crop: "paddy" },
];

export interface HouseSpec {
  x: number;
  z: number;
  /** Radians; the house front (+z local) faces the road. */
  rot: number;
  w: number;
  d: number;
  h: number;
  wall: string;
  trim: string;
  roof: "flat" | "tile";
  floors?: 1 | 2;
}

const FACE_EAST = Math.PI / 2;
const FACE_WEST = -Math.PI / 2;
const FACE_NORTH = Math.PI;
const FACE_SOUTH = 0;

export const HOUSES: HouseSpec[] = [
  // Main road, south half.
  {
    x: -11,
    z: 30,
    rot: FACE_EAST,
    w: 7,
    d: 6,
    h: 3.2,
    wall: "#e9c46a",
    trim: "#7a4e2d",
    roof: "tile",
  },
  {
    x: -12,
    z: 45,
    rot: FACE_EAST,
    w: 8,
    d: 6.5,
    h: 3,
    wall: "#7fc8c2",
    trim: "#f4efe6",
    roof: "flat",
    floors: 2,
  },
  {
    x: -11,
    z: 60,
    rot: FACE_EAST,
    w: 6.5,
    d: 6,
    h: 3.1,
    wall: "#f2d0a4",
    trim: "#9c4a2f",
    roof: "tile",
  },
  {
    x: -12,
    z: 74,
    rot: FACE_EAST,
    w: 7,
    d: 6,
    h: 3,
    wall: "#e8a1a1",
    trim: "#f6eee2",
    roof: "flat",
  },
  {
    x: 12,
    z: 26,
    rot: FACE_WEST,
    w: 7,
    d: 6,
    h: 3,
    wall: "#f6efe3",
    trim: "#2f7f8f",
    roof: "flat",
    floors: 2,
  },
  {
    x: 11,
    z: 40,
    rot: FACE_WEST,
    w: 6.5,
    d: 6,
    h: 3.2,
    wall: "#c8a2d6",
    trim: "#f6eee2",
    roof: "tile",
  },
  {
    x: 12,
    z: 56,
    rot: FACE_WEST,
    w: 7.5,
    d: 6,
    h: 3,
    wall: "#f4b860",
    trim: "#6b3f22",
    roof: "flat",
  },
  {
    x: 11,
    z: 70,
    rot: FACE_WEST,
    w: 6,
    d: 5.5,
    h: 3,
    wall: "#9fd3a8",
    trim: "#f6eee2",
    roof: "tile",
  },
  // Main road, north half.
  {
    x: -11,
    z: -22,
    rot: FACE_EAST,
    w: 7,
    d: 6,
    h: 3,
    wall: "#f0e0c0",
    trim: "#a0522d",
    roof: "tile",
  },
  {
    x: 12,
    z: -26,
    rot: FACE_WEST,
    w: 7,
    d: 6,
    h: 3.1,
    wall: "#86b9e0",
    trim: "#f6eee2",
    roof: "flat",
  },
  {
    x: -12,
    z: -38,
    rot: FACE_EAST,
    w: 6.5,
    d: 6,
    h: 3,
    wall: "#e9c46a",
    trim: "#6b3f22",
    roof: "flat",
    floors: 2,
  },
  {
    x: 11,
    z: -41,
    rot: FACE_WEST,
    w: 6.5,
    d: 5.5,
    h: 3,
    wall: "#f2b5a0",
    trim: "#f6eee2",
    roof: "tile",
  },
  // Cross road, west.
  {
    x: -24,
    z: -11,
    rot: FACE_SOUTH,
    w: 7,
    d: 6,
    h: 3,
    wall: "#f4efe6",
    trim: "#c0392b",
    roof: "tile",
  },
  {
    x: -36,
    z: -12,
    rot: FACE_SOUTH,
    w: 7.5,
    d: 6,
    h: 3.2,
    wall: "#a9d6cf",
    trim: "#f6eee2",
    roof: "flat",
  },
  {
    x: -63,
    z: -11,
    rot: FACE_SOUTH,
    w: 7,
    d: 6,
    h: 3,
    wall: "#f1c27d",
    trim: "#7a4e2d",
    roof: "tile",
  },
  {
    x: -86,
    z: -11,
    rot: FACE_SOUTH,
    w: 6.5,
    d: 6,
    h: 3,
    wall: "#e8a1a1",
    trim: "#f6eee2",
    roof: "flat",
  },
  {
    x: -60,
    z: 12,
    rot: FACE_NORTH,
    w: 7,
    d: 6,
    h: 3,
    wall: "#d7e3a3",
    trim: "#6b3f22",
    roof: "tile",
  },
  {
    x: -88,
    z: 11,
    rot: FACE_NORTH,
    w: 6.5,
    d: 6,
    h: 3,
    wall: "#f6e7c8",
    trim: "#2f7f8f",
    roof: "flat",
  },
  // Cross road, east (beyond the market).
  {
    x: 52,
    z: -12,
    rot: FACE_SOUTH,
    w: 7,
    d: 6,
    h: 3,
    wall: "#f6efe3",
    trim: "#d35400",
    roof: "flat",
    floors: 2,
  },
  {
    x: 64,
    z: 12,
    rot: FACE_NORTH,
    w: 7,
    d: 6,
    h: 3,
    wall: "#9ec5e8",
    trim: "#f6eee2",
    roof: "tile",
  },
  {
    x: 48,
    z: 13,
    rot: FACE_NORTH,
    w: 6.5,
    d: 6,
    h: 3,
    wall: "#f4b860",
    trim: "#7a4e2d",
    roof: "tile",
  },
  {
    x: 92,
    z: -11,
    rot: FACE_SOUTH,
    w: 7,
    d: 6,
    h: 3,
    wall: "#e9c46a",
    trim: "#f6eee2",
    roof: "flat",
  },
  {
    x: 94,
    z: 12,
    rot: FACE_NORTH,
    w: 6.5,
    d: 6,
    h: 3,
    wall: "#f2d0a4",
    trim: "#9c4a2f",
    roof: "tile",
  },
  // Farmhouses beyond the river.
  {
    x: -22,
    z: -116,
    rot: FACE_SOUTH,
    w: 7,
    d: 6,
    h: 3,
    wall: "#e6cfa1",
    trim: "#7a4e2d",
    roof: "tile",
  },
  {
    x: 30,
    z: -117,
    rot: FACE_SOUTH,
    w: 6.5,
    d: 6,
    h: 3,
    wall: "#f0e0c0",
    trim: "#6b3f22",
    roof: "tile",
  },
];
