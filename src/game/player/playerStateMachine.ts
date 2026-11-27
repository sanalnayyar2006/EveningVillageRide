import type { PlayerState } from "@/types/game";

/** Allowed moves out of each state. Anything not listed is rejected. */
const PLAYER_TRANSITIONS: Record<PlayerState, readonly PlayerState[]> = {
  idle: ["cycling", "paused"],
  cycling: ["stopping", "interacting", "viewingGallery", "paused", "idle"],
  stopping: ["takingPhoto", "cycling", "paused"],
  takingPhoto: ["cycling", "paused"],
  interacting: ["cycling", "paused"],
  viewingGallery: ["cycling", "paused"],
  paused: ["cycling", "takingPhoto", "interacting", "viewingGallery", "stopping", "idle"],
};

export const canTransition = (from: PlayerState, to: PlayerState) =>
  from === to || PLAYER_TRANSITIONS[from].includes(to);
