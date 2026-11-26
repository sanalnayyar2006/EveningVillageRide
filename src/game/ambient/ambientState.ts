/**
 * The evening's shared, slowly changing state. Mutated in place every frame by
 * AmbientDirector (like the bike telemetry), read by lighting, wind, sound and
 * the creatures. Nothing here triggers React renders.
 */
export const ambient = {
  /** 0 = golden hour when the ride starts, 1 = blue dusk. Holds at 1. */
  dayProgress: 0,
  /** Steady breeze, 0..1. */
  breeze: 0.18,
  /** Extra wind from a passing gust, 0..1. */
  gust: 0,
  /** Seconds since the world started, for animation. */
  time: 0,
};

/** How long the sun takes to set, in seconds of riding. */
export const DUSK_SECONDS = 15 * 60;

/** Total wind strength right now, 0..1. */
export const windStrength = () => Math.min(1, ambient.breeze + ambient.gust);
