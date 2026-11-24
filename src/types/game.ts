export type Vec3Tuple = [number, number, number];

/** Top-level application flow. */
export type GamePhase = "loading" | "playing";

/** Exactly one player state is active at a time (see GameplaySystem.md §1). */
export type PlayerState =
  "idle" | "cycling" | "stopping" | "takingPhoto" | "viewingGallery" | "interacting" | "paused";
