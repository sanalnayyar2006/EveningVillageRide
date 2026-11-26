import { MeshStandardMaterial } from "three";
import { addWindSway } from "@/game/ambient/wind";

// Shared materials for the village. Most scenery is vertex-coloured, so one material covers it.

export const WORLD_MATERIALS = {
  /** Matte painted walls, wood, stone, foliage: anything coloured per vertex. */
  painted: new MeshStandardMaterial({ vertexColors: true, roughness: 0.88 }),
  /** Same, but for instanced meshes whose per-instance colour tints the vertex colour. */
  instanced: new MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }),
  water: new MeshStandardMaterial({ color: "#7aa3a2", roughness: 0.18, metalness: 0 }),
  /** Warm glow for lamp bulbs and lit windows. */
  glow: new MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ffb85c", emissiveIntensity: 2.2 }),
  // Both road surfaces are pulled towards the camera so they never flicker against the
  // terrain; asphalt more so, so it wins where a dirt lane joins it.
  asphalt: new MeshStandardMaterial({
    color: "#7a726a",
    roughness: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  }),
  dirtRoad: new MeshStandardMaterial({
    color: "#b58b5b",
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  }),
} as const;

// Trees, grass, flowers and crops all sway in the evening breeze.
addWindSway(WORLD_MATERIALS.instanced);

/** The village palette, so the same "whitewash" or "saffron" is used everywhere. */
export const PALETTE = {
  whitewash: "#f3ece0",
  cream: "#efe2c4",
  stone: "#c9b79c",
  darkStone: "#8f806b",
  wood: "#7a5232",
  darkWood: "#4e3421",
  terracotta: "#b8552f",
  saffron: "#f08a24",
  vermilion: "#d5352a",
  gold: "#d9a73a",
  tin: "#9aa0a3",
  rust: "#8c4a2b",
  iron: "#2d2b29",
  hay: "#d8b45a",
  leaf: "#5f7d33",
  darkLeaf: "#47622a",
  bark: "#5b4130",
  windowDark: "#2a2420",
} as const;
