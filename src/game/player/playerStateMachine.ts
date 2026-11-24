import type { PlayerState } from "@/types/game";

/** Which states each state may move to. Anything else is rejected. */
export const PLAYER_TRANSITIONS: Record<PlayerState, readonly PlayerState[]> = {
  idle: ["cycling", "paused"],
  cycling: ["stopping", "interacting", "viewingGallery", "paused", "idle"],
  stopping: ["takingPhoto", "cycling", "paused"],
  takingPhoto: ["cycling", "paused"],
  interacting: ["cycling", "paused"],
  viewingGallery: ["cycling", "paused", "takingPhoto", "interacting", "stopping", "idle"],
  paused: ["cycling", "takingPhoto", "interacting", "viewingGallery", "stopping", "idle"],
};

/** States that overlay others and return to what was underneath. */
export const OVERLAY_STATES: readonly PlayerState[] = ["paused", "viewingGallery"];

export const canTransition = (from: PlayerState, to: PlayerState) =>
  from === to || PLAYER_TRANSITIONS[from].includes(to);

/** True while the world simulation should advance for the player. */
export const isSimulating = (state: PlayerState) =>
  state !== "paused" && state !== "viewingGallery";
