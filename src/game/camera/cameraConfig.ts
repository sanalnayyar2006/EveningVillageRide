/** Third-person ride camera tuning. Angles in radians, distances in metres. */
export const RIDE_CAMERA = {
  /** Height above the bike origin the camera aims at (rider's shoulders). */
  targetHeight: 1.35,
  distance: { default: 5, min: 2.6, max: 10, wheelStep: 0.6 },
  pitch: { default: 0.24, min: -0.05, max: 1.1 },
  /** Mouse drag radians per pixel at sensitivity 1. */
  dragSensitivity: 0.005,
  /** How quickly the camera swings round behind the bike (lag). */
  yawFollow: 3.2,
  positionFollow: 9,
  /** Recenter behind the bike after this long without dragging, while moving. */
  recenterDelayMs: 1600,
  recenterRate: 1.4,
  /** The camera looks this many seconds of travel ahead of the bike. */
  lookAhead: 0.22,
  /** Collision: keep this far in front of whatever blocks the view. */
  collisionPadding: 0.35,
  minCollisionDistance: 0.9,
  /** Distance returns slowly after an obstruction so it never pops. */
  distanceRecover: 2.5,
  baseFov: 55,
  /** Extra field of view at top speed, for a gentle sense of motion. */
  speedFov: 6,
  groundClearance: 0.35,
} as const;
