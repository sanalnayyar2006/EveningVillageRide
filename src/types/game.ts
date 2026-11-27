export type Vec3Tuple = [number, number, number];

/** loading → title (the menu over the live scene) → playing. */
export type GamePhase = "loading" | "title" | "playing";

/** Exactly one is active at a time (GameplaySystem.md §1). */
export type PlayerState =
  "idle" | "cycling" | "stopping" | "takingPhoto" | "viewingGallery" | "interacting" | "paused";
