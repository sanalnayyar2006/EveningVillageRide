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
  /** Three's Sky shader is very bright, so exposure is low and the lights compensate. */
  exposure: 0.55,
  sky: { turbidity: 12, rayleigh: 4, mieCoefficient: 0.008, mieDirectionalG: 0.82 },
  /** Half-size of the square the sun's shadow map covers. */
  shadowExtent: 40,
} as const;
