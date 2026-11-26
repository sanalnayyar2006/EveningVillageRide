import type { WebGLRenderer } from "three";
import { useBikeStore } from "@/store/bikeStore";
import { ambient } from "@/game/ambient/ambientState";
import { useGalleryStore } from "@/store/galleryStore";
import { useGameStore } from "@/store/gameStore";
import { usePhotoStore } from "@/store/photoStore";
import { usePlayerStore } from "@/store/playerStore";

let renderer: WebGLRenderer | null = null;

/** Called from the Canvas so the debug handle can report draw calls. */
export function registerRenderer(gl: WebGLRenderer): void {
  renderer = gl;
}

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
    photo: usePhotoStore,
    gallery: useGalleryStore,
    /** Mutable evening state; e.g. `__evr.ambient.dayProgress = 0.9` jumps to dusk. */
    ambient,
    renderStats: () =>
      renderer && {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
      },
  };
}
