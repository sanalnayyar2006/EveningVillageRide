/**
 * useFrame priorities. Negative values run before R3F's default (0) without
 * taking over rendering, so systems update in a fixed, explicit order.
 */
export const FRAME_ORDER = {
  player: -50,
  bike: -40,
  camera: -30,
  /** Must run after every system that reads input this frame. */
  inputEnd: -1,
} as const;

/** Largest simulation step; protects against huge jumps after a tab switch. */
export const MAX_DT = 1 / 20;
