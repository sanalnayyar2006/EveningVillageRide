// Flat ground for now. The village terrain (Phase 2) plugs in behind these same functions.

/** The bike can't ride further than this from the world origin (metres). */
export const RIDE_RADIUS = 150;

export function groundHeight(_x: number, _z: number): number {
  return 0;
}
