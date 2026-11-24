import { Euler, Vector3 } from "three";
import { BIKE_CONFIG } from "./bikeConfig";

/**
 * Bike-local measurements (metres). Origin on the ground below the bottom
 * bracket, +Z forward, +Y up, +X to the rider's left.
 */
const R = BIKE_CONFIG.wheelRadius;
/** Head tube rake: the steering axis leans back by this much. */
export const HEAD_ANGLE = 0.29;
export const HEAD_BOTTOM = new Vector3(0, 0.76, 0.4);
const FORK_LENGTH = (HEAD_BOTTOM.y - R) / Math.cos(HEAD_ANGLE);

export const BIKE_POINTS = {
  bottomBracket: new Vector3(0, 0.29, -0.02),
  seatCluster: new Vector3(0, 0.86, -0.22),
  headBottom: HEAD_BOTTOM,
  headTop: new Vector3(0, 0.76 + 0.18 * Math.cos(HEAD_ANGLE), 0.4 - 0.18 * Math.sin(HEAD_ANGLE)),
  rearAxle: new Vector3(0, R, -0.53),
  /** Front axle in steering-assembly space (straight down the steering axis). */
  forkAxleLocal: new Vector3(0, -FORK_LENGTH, 0),
  saddle: new Vector3(0, 1.02, -0.25),
  crankLength: 0.17,
  pedalOffset: 0.115,
} as const;

/** Grip position in steering-assembly space (handlebars sweep back to the rider). */
export const GRIP_LOCAL = new Vector3(0.29, 0.37, -0.17);

const steerEuler = new Euler();

/** Where a grip ends up in bike space for a given steering angle. side: +1 left, -1 right. */
export function gripPosition(steer: number, side: 1 | -1, out: Vector3): Vector3 {
  out.set(GRIP_LOCAL.x * side, GRIP_LOCAL.y, GRIP_LOCAL.z);
  out.applyEuler(steerEuler.set(0, steer, 0));
  out.applyEuler(steerEuler.set(-HEAD_ANGLE, 0, 0));
  return out.add(HEAD_BOTTOM);
}

/** Pedal position in bike space. side: +1 left, -1 right. */
export function pedalPosition(crankAngle: number, side: 1 | -1, out: Vector3): Vector3 {
  const { bottomBracket: bb, crankLength: l, pedalOffset } = BIKE_POINTS;
  // Right crank points down at angle 0; left crank is opposite.
  const k = side === -1 ? 1 : -1;
  return out.set(
    bb.x + pedalOffset * side,
    bb.y - k * l * Math.cos(crankAngle),
    bb.z - k * l * Math.sin(crankAngle),
  );
}
