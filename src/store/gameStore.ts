import { create } from "zustand";
import type { GamePhase } from "@/types/game";

interface GameStore {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
  phase: "loading",
  setPhase: (phase) => set({ phase }),
}));
