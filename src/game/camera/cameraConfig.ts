/** Third-person ride camera tuning. Angles in radians, distances in metres. */
export const RIDE_CAMERA = {
  /** The camera orbits this point above the bike (the rider's shoulders). */
  targetHeight: 1.35,
  /** …and looks at a point slightly lower. */
  lookHeight: 1.25,
  distance: { default: 5, min: 2.6, max: 10, wheelStep: 0.6 },
  pitch: { default: 0.24, min: -0.05, max: 1.1 },
  /** Radians of orbit per pixel of mouse drag, at sensitivity 1. */
  dragSensitivity: 0.005,

  /** How quickly the orbit catches up with the bike's heading; lower = lazier turns. */
  yawFollow: 3.2,
  /** Near-instant follow while the player is dragging, so the view feels direct. */
  dragYawFollow: 20,
  positionFollow: 9,

  /** Swing back behind the bike after this long without dragging… */
  recenterDelayMs: 1600,
  /** …but only while riding faster than this (m/s). */
  recenterMinSpeed: 0.8,
  recenterRate: 1.4,

  /** Look this many seconds of travel ahead of the bike. */
  lookAhead: 0.22,

  /** Gap kept between the camera and whatever blocks its view. */
  collisionPadding: 0.35,
  minCollisionDistance: 0.9,
  /** Ease back out slowly after an obstruction so the camera never pops. */
  distanceRecover: 2.5,
  groundClearance: 0.35,

  baseFov: 55,
  /** Extra field of view at top speed, for a gentle sense of motion. */
  speedFov: 6,
  fovResponse: 3,
} as const;
