export type Vec3Tuple = [number, number, number];

export type GamePhase = "loading" | "playing";

/** Exactly one is active at a time (GameplaySystem.md §1). */
export type PlayerState =
  "idle" | "cycling" | "stopping" | "takingPhoto" | "viewingGallery" | "interacting" | "paused";
