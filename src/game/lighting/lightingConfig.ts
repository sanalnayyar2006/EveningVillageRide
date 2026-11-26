import type { Vec3Tuple } from "@/types/game";

/** The light when the ride starts: golden hour, the sun low in the west-north-west. */
export const GOLDEN_HOUR = {
  /** Direction towards the sun: low in the west-north-west. */
  sunDirection: [-0.74, 0.065, -0.6] as Vec3Tuple,
  sunColor: "#ffb36b",
  sunIntensity: 4.8,
  skyColor: "#ffd4a3",
  groundColor: "#6b5236",
  hemisphereIntensity: 1.9,
  fogColor: "#d9a284",
  fogNear: 45,
  fogFar: 280,
  /** Three's Sky shader is very bright, so exposure is low and the lights compensate. */
  exposure: 0.55,
  sky: { turbidity: 12, rayleigh: 4, mieCoefficient: 0.008, mieDirectionalG: 0.82 },
  /** Half-size of the square the sun's shadow map covers. */
  shadowExtent: 45,
} as const;

/**
 * Where the evening ends up after DUSK_SECONDS: the sun just below the hills,
 * a lilac sky, and lamps and windows doing most of the work. Lighting blends
 * from GOLDEN_HOUR to this as ambientState.dayProgress goes from 0 to 1.
 */
export const DUSK = {
  /** Just above the hills: any lower and the low-angle shadow map smears across walls. */
  sunElevation: 0.018,
  sunColor: "#ff6a3d",
  sunIntensity: 0.8,
  skyColor: "#9a8fc0",
  groundColor: "#3c3244",
  hemisphereIntensity: 1.25,
  fogColor: "#80748f",
  exposure: 0.72,
} as const;

/** Lamp and lit-window glow: dim against the sunset, bright once dusk falls. */
export const GLOW = { golden: 1.1, dusk: 3.2 } as const;
