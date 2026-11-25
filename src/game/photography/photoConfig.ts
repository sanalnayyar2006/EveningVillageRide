import { smoothstep } from "@/utils/math";

const DEG = Math.PI / 180;

/** Phone and photo-mode tuning. Angles in radians, distances in metres. */
export const PHOTO_CONFIG = {
  /** Seconds to reach into the pocket and raise the phone, and to put it away. */
  raiseSeconds: 1.1,
  lowerSeconds: 0.7,
  /** The bike counts as stopped below this speed (m/s). */
  stoppedSpeed: 0.05,

  /** Eye position relative to the bike, in bike space. */
  eye: { height: 1.72, forward: 0.02 },
  /** How far you can turn your head from the bike's heading. */
  yawLimit: 100 * DEG,
  pitchLimit: 60 * DEG,
  /** Radians of look per pixel of mouse drag, at sensitivity 1. */
  lookSensitivity: 0.0035,

  fov: { default: 65, min: 30, max: 70, wheelStep: 4 },
  /** Focus is measured up to this far; anything beyond reads as infinity. */
  focusRange: 150,

  capture: { maxWidth: 1920, aspect: 16 / 9, thumbWidth: 320, quality: 0.9 },
} as const;

/**
 * How far the view has moved from the ride camera into the rider's eyes, for
 * a given phone `raise` (0 = in pocket, 1 = held up). The camera only starts
 * moving once the phone is on its way up, so you see the rider reach for it.
 */
export const firstPersonBlend = (raise: number) => smoothstep(0.45, 1, raise);
