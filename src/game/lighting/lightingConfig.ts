import type { Vec3Tuple } from "@/types/game";

/** Static golden hour (GameplaySystem.md §14 — dynamic time is future scope). */
export const GOLDEN_HOUR = {
  /** Direction towards the sun: low in the west-north-west. */
  sunDirection: [-0.74, 0.065, -0.6] as Vec3Tuple,
  sunColor: "#ffb36b",
  sunIntensity: 4.8,
  skyColor: "#ffd4a3",
  groundColor: "#6b5236",
  hemisphereIntensity: 1.5,
  fogColor: "#d9a284",
  fogNear: 45,
  fogFar: 280,
  exposure: 0.55,
  sky: { turbidity: 12, rayleigh: 4, mieCoefficient: 0.008, mieDirectionalG: 0.82 },
  /** Half-size of the area the sun's shadow map covers around the player. */
  shadowExtent: 40,
} as const;
