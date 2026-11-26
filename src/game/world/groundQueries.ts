import { WORLD } from "./data/layout";
import { heightAt, slopeAt } from "./terrain";

export const groundHeight = heightAt;
export const groundSlope = slopeAt;

/** Keeps a point inside the rideable area, letting the bike slide along its edge. */
export function clampToRideArea(x: number, z: number): [number, number] {
  const { minX, maxX, minZ, maxZ } = WORLD.rideBounds;
  return [Math.min(maxX, Math.max(minX, x)), Math.min(maxZ, Math.max(minZ, z))];
}
