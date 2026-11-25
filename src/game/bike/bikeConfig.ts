/** Tuning for a relaxed evening ride: not a simulation, not an arcade racer. */
export const BIKE_CONFIG = {
  /** m/s (~25 km/h). */
  maxSpeed: 7,
  /** m/s² at standstill; tapers off towards max speed. */
  acceleration: 2.4,
  /** Constant rolling resistance, m/s². */
  rollingResistance: 0.12,
  /** Speed-proportional drag, 1/s. */
  drag: 0.05,
  brakeDeceleration: 6.5,
  reverseMaxSpeed: 1.5,
  reverseAcceleration: 1.4,
  /** Below this speed (m/s) the bike counts as stopped. */
  stoppedSpeed: 0.05,
  /** Keep holding S this long after stopping before the bike starts to reverse (s). */
  reverseDelay: 0.35,

  /** Handlebar angle at walking pace and at top speed (radians). */
  maxSteerSlow: 0.55,
  maxSteerFast: 0.16,
  steerResponse: 3.6,
  steerReturn: 5,
  wheelbase: 1.06,

  maxLean: 0.36,
  leanResponse: 5,

  wheelRadius: 0.34,
  /** Wheel revolutions per crank revolution. */
  gearRatio: 2.4,
  /** After hitting something, keep at least this fraction of speed (or more, if the bike slid). */
  bumpSpeedRetention: 0.35,
} as const;

export type BikeConfig = typeof BIKE_CONFIG;
