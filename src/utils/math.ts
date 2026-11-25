export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Frame-rate independent smoothing factor: use as `x += (target - x) * damp(rate, dt)`. */
export const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

/** Move `value` toward `target` by at most `maxDelta`. */
export const approach = (value: number, target: number, maxDelta: number) =>
  value < target ? Math.min(value + maxDelta, target) : Math.max(value - maxDelta, target);

/** 0 below `edge0`, 1 above `edge1`, smooth S-curve in between. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Shortest signed difference between two angles, in radians. */
export function angleDelta(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

/** Seeded random generator, so generated content looks the same on every visit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
