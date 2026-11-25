import { WORLD } from "./data/layout";
import { heightAt, slopeAt } from "./terrain";

/** The bike can't ride further than this from the village centre (metres). */
export const RIDE_RADIUS = WORLD.rideRadius;

export const groundHeight = heightAt;
export const groundSlope = slopeAt;
