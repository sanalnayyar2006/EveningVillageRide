import type { GeometryBatch } from "../batch";
import { heightAt } from "../terrain";

/** Build something standing on the terrain at (x, z), turned by `rotationY`. */
export function onGround(
  b: GeometryBatch,
  x: number,
  z: number,
  rotationY: number,
  build: () => void,
): void {
  b.group([x, heightAt(x, z), z], rotationY, build);
}
