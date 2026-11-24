import { useBikeStore } from "@/store/bikeStore";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";

/**
 * Development-only console handle (`window.__evr`) for inspecting and
 * nudging game state while testing. Never installed in production builds.
 */
export function installDebugHandle(): void {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return;
  (window as unknown as { __evr: unknown }).__evr = {
    bike: useBikeStore,
    player: usePlayerStore,
    game: useGameStore,
  };
}
