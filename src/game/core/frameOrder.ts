/**
 * useFrame priorities. Negative values run before R3F's default (0) without
 * taking over rendering, so systems update in a fixed, explicit order.
 */
export const FRAME_ORDER = {
  player: -50,
  /** Villagers and animals move before the bike, so it collides with where they are now. */
  life: -45,
  bike: -40,
  camera: -30,
  /** Blends from the ride camera into first person, so it runs after it. */
  photoCamera: -25,
  /** Takes the picture once the camera is final for this frame. */
  photoCapture: -20,
  /** Must run after every system that reads input this frame. */
  inputEnd: -1,
} as const;

/** Longest step simulated in one frame, so a slow frame or a tab switch can't teleport the bike. */
export const MAX_DT = 1 / 20;
