import { InstancedMesh, Mesh, type Object3D, type Scene, type WebGLRenderer } from "three";
import { useBikeStore } from "@/store/bikeStore";
import { ambient } from "@/game/ambient/ambientState";
import { useGalleryStore } from "@/store/galleryStore";
import { useGameStore } from "@/store/gameStore";
import { usePhotoStore } from "@/store/photoStore";
import { usePlayerStore } from "@/store/playerStore";

let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;

/** Called from the Canvas so the debug handle can report draw calls and inspect the scene. */
export function registerRenderer(gl: WebGLRenderer, root: Scene): void {
  renderer = gl;
  scene = root;
  // PostEffects resets the counts once per frame instead of once per pass.
  gl.info.autoReset = false;
}

/** What the last frame cost: draw calls and triangles across every pass (shadows included). */
export function renderStats() {
  return (
    renderer && {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      pixelRatio: renderer.getPixelRatio(),
    }
  );
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
    renderStats,
    /** The meshes with the most triangles (whole mesh, all instances), to find what to optimise. */
    heaviestMeshes: (count = 12) => heaviestMeshes(count),
  };
}

/** The nearest name up the tree, so unnamed parts show which component they belong to. */
function meshLabel(object: Mesh): string {
  for (let node: Object3D | null = object; node; node = node.parent) {
    if (node.name) return node === object ? node.name : `${node.name} › ${object.geometry.type}`;
  }
  return `${object.geometry.type} (${object.material instanceof Array ? "multi" : object.material.type})`;
}

function heaviestMeshes(count: number) {
  const rows: { name: string; triangles: number; instances: number; shadow: boolean }[] = [];
  scene?.traverseVisible((object) => {
    if (!(object instanceof Mesh)) return;
    const geometry = object.geometry;
    const vertices = geometry.index?.count ?? geometry.getAttribute("position")?.count ?? 0;
    const instances = object instanceof InstancedMesh ? object.count : 1;
    rows.push({
      name: meshLabel(object),
      triangles: (vertices / 3) * instances,
      instances,
      shadow: object.castShadow,
    });
  });
  return rows.sort((a, b) => b.triangles - a.triangles).slice(0, count);
}
