import { Euler, Vector3 } from "three";
import { BIKE_CONFIG } from "./bikeConfig";

// Bike-local space, in metres: origin on the ground under the pedals,
// +Z forward, +Y up, +X towards the rider's left.

const WHEEL_RADIUS = BIKE_CONFIG.wheelRadius;

/** The steering axis leans back from vertical by this angle (radians). */
export const HEAD_ANGLE = 0.29;
const HEAD_BOTTOM = new Vector3(0, 0.76, 0.4);
const HEAD_LENGTH = 0.18;
const FORK_LENGTH = (HEAD_BOTTOM.y - WHEEL_RADIUS) / Math.cos(HEAD_ANGLE);

export const BIKE_POINTS = {
  bottomBracket: new Vector3(0, 0.29, -0.02),
  seatCluster: new Vector3(0, 0.86, -0.22),
  headBottom: HEAD_BOTTOM,
  headTop: new Vector3(
    0,
    HEAD_BOTTOM.y + HEAD_LENGTH * Math.cos(HEAD_ANGLE),
    HEAD_BOTTOM.z - HEAD_LENGTH * Math.sin(HEAD_ANGLE),
  ),
  rearAxle: new Vector3(0, WHEEL_RADIUS, -0.53),
  /** Front axle, measured inside the tilted steering assembly. */
  forkAxleLocal: new Vector3(0, -FORK_LENGTH, 0),
  saddle: new Vector3(0, 1.02, -0.25),
  crankLength: 0.17,
  /** Sideways distance from the frame centre to each pedal. */
  pedalOffset: 0.115,
} as const;

/** Left grip inside the steering assembly; the handlebars sweep back towards the rider. */
export const GRIP_LOCAL = new Vector3(0.29, 0.37, -0.17);

const euler = new Euler();

/** Grip position in bike space for a steering angle. side: 1 = left, -1 = right. */
export function gripPosition(steer: number, side: 1 | -1, out: Vector3): Vector3 {
  out.set(GRIP_LOCAL.x * side, GRIP_LOCAL.y, GRIP_LOCAL.z);
  out.applyEuler(euler.set(0, steer, 0));
  out.applyEuler(euler.set(-HEAD_ANGLE, 0, 0));
  return out.add(HEAD_BOTTOM);
}

/** Pedal position in bike space. side: 1 = left, -1 = right. */
export function pedalPosition(crankAngle: number, side: 1 | -1, out: Vector3): Vector3 {
  const { bottomBracket, crankLength, pedalOffset } = BIKE_POINTS;
  // At angle 0 the right crank points straight down; the left crank is half a turn away.
  const angle = side === -1 ? crankAngle : crankAngle + Math.PI;
  return out.set(
    bottomBracket.x + pedalOffset * side,
    bottomBracket.y - crankLength * Math.cos(angle),
    bottomBracket.z - crankLength * Math.sin(angle),
  );
}
