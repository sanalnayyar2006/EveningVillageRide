import { create } from "zustand";
import { canTransition } from "@/game/player/playerStateMachine";
import type { PlayerState } from "@/types/game";

interface PlayerStore {
  state: PlayerState;
  /** Returns false (and keeps the current state) if the move isn't allowed. */
  transition: (to: PlayerState) => boolean;
}

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  state: "idle",
  transition: (to) => {
    const from = get().state;
    if (!canTransition(from, to)) {
      console.warn(`[player] rejected transition ${from} → ${to}`);
      return false;
    }
    set({ state: to });
    return true;
  },
}));
