import { create } from "zustand";
import type { PlayerState } from "@/types/game";
import { canTransition, OVERLAY_STATES } from "@/game/player/playerStateMachine";

interface PlayerStore {
  state: PlayerState;
  /** States hidden underneath pause / gallery overlays. */
  stack: PlayerState[];
  transition: (to: PlayerState) => boolean;
  /** Close the top overlay and return to the state beneath it. */
  resume: () => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  state: "idle",
  stack: [],
  transition: (to) => {
    const { state, stack } = get();
    if (!canTransition(state, to)) {
      console.warn(`[player] rejected transition ${state} → ${to}`);
      return false;
    }
    if (state === to) return true;
    if (OVERLAY_STATES.includes(to)) {
      set({ state: to, stack: [...stack, state] });
    } else {
      set({ state: to });
    }
    return true;
  },
  resume: () => {
    const { stack } = get();
    const previous = stack[stack.length - 1];
    if (!previous) return;
    set({ state: previous, stack: stack.slice(0, -1) });
  },
  reset: () => set({ state: "idle", stack: [] }),
}));
