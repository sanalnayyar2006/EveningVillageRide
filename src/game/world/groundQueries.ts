/**
 * Ground queries. Phase 1 rides on flat ground; Phase 2 swaps in the village
 * terrain behind this same interface, so callers never change.
 */
export const RIDE_RADIUS = 150;

export function groundHeight(_x: number, _z: number): number {
  return 0;
}
