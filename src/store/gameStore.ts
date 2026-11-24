import { create } from "zustand";
import type { GamePhase } from "@/types/game";
import { events } from "@/game/core/events";

interface GameStore {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  phase: "loading",
  setPhase: (phase) => {
    if (get().phase === phase) return;
    set({ phase });
    events.emit("game:phase", { phase });
  },
}));
