/**
 * useFrame priorities, so systems update in a fixed, explicit order. Everything
 * negative runs before the frame is drawn.
 */
export const FRAME_ORDER = {
  player: -50,
  /** Villagers and animals move before the bike, so it collides with where they are now. */
  life: -45,
  bike: -40,
  camera: -30,
  /** Blends from the ride camera into first person, so it runs after it. */
  photoCamera: -25,
  /** Reads the shutter button once the camera is final for this frame. */
  shutter: -20,
  /** Must run after every system that reads input this frame. */
  inputEnd: -1,
  /**
   * The post-processing composer draws the frame. A positive priority also
   * tells R3F not to render on its own.
   */
  render: 1,
  /** Copies the frame the composer just drew, so photos look exactly like the screen. */
  photoCapture: 2,
} as const;

/** Longest step simulated in one frame, so a slow frame or a tab switch can't teleport the bike. */
export const MAX_DT = 1 / 20;
