import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
  type ColorRepresentation,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Vec3 = [number, number, number];

const color = new Color();
const matrix = new Matrix4();
const quaternion = new Quaternion();
const euler = new Euler();
const position = new Vector3();
const scale = new Vector3();

/** "main" is ordinary lit scenery; "glow" is for things that give off light (bulbs, lit windows). */
export type BatchLayer = "main" | "glow";

/**
 * Collects many small coloured shapes and merges them into one geometry per
 * layer, so a whole house or landmark renders in one or two draw calls.
 *
 * Shapes are placed relative to the current transform, which `group` nests:
 *   b.group([10, 0, 5], Math.PI / 2, () => b.box([2, 3, 2], [0, 1.5, 0], "#e9c46a"));
 */
export class GeometryBatch {
  private parts: Record<BatchLayer, BufferGeometry[]> = { main: [], glow: [] };
  private layer: BatchLayer = "main";
  private stack: Matrix4[] = [new Matrix4()];

  private get current(): Matrix4 {
    return this.stack[this.stack.length - 1] as Matrix4;
  }

  /** Run `build` with everything offset by `offset` and turned by `rotationY` radians. */
  group(offset: Vec3, rotationY: number, build: () => void): void {
    quaternion.setFromEuler(euler.set(0, rotationY, 0));
    const local = new Matrix4().compose(position.set(...offset), quaternion, scale.set(1, 1, 1));
    this.stack.push(this.current.clone().multiply(local));
    build();
    this.stack.pop();
  }

  /** Everything added inside `build` goes to the glow layer. */
  glowing(build: () => void): void {
    const previous = this.layer;
    this.layer = "glow";
    build();
    this.layer = previous;
  }

  /** Add any geometry. The batch takes ownership and may modify it. */
  add(
    geometry: BufferGeometry,
    at: Vec3,
    tint: ColorRepresentation,
    rotation: Vec3 = [0, 0, 0],
    size: Vec3 = [1, 1, 1],
  ): void {
    // Merging needs identical attributes on every part: non-indexed position, normal, colour.
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    if (part !== geometry) geometry.dispose();
    part.deleteAttribute("uv");

    quaternion.setFromEuler(euler.set(...rotation));
    matrix.compose(position.set(...at), quaternion, scale.set(...size));
    part.applyMatrix4(this.current.clone().multiply(matrix));

    color.set(tint);
    const count = part.getAttribute("position").count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) colors.set([color.r, color.g, color.b], i * 3);
    part.setAttribute("color", new BufferAttribute(colors, 3));
    this.parts[this.layer].push(part);
  }

  box(size: Vec3, at: Vec3, tint: ColorRepresentation, rotation?: Vec3): void {
    this.add(new BoxGeometry(...size), at, tint, rotation);
  }

  cylinder(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    at: Vec3,
    tint: ColorRepresentation,
    segments = 10,
    rotation?: Vec3,
  ): void {
    this.add(new CylinderGeometry(radiusTop, radiusBottom, height, segments), at, tint, rotation);
  }

  cone(
    radius: number,
    height: number,
    at: Vec3,
    tint: ColorRepresentation,
    segments = 10,
    rotation?: Vec3,
  ): void {
    this.add(new ConeGeometry(radius, height, segments), at, tint, rotation);
  }

  sphere(radius: number, at: Vec3, tint: ColorRepresentation, size?: Vec3): void {
    this.add(new SphereGeometry(radius, 10, 6), at, tint, undefined, size);
  }

  /**
   * A faceted blob, good for low-poly foliage and hay. `detail` 1 has 80 triangles;
   * use 0 (20 triangles) for anything small or repeated thousands of times.
   */
  blob(radius: number, at: Vec3, tint: ColorRepresentation, size?: Vec3, detail: 0 | 1 = 1): void {
    this.add(new IcosahedronGeometry(radius, detail), at, tint, undefined, size);
  }

  /** A box stretched between two points, e.g. a rail or a beam. */
  beam(from: Vec3, to: Vec3, thickness: number, tint: ColorRepresentation): void {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const length = a.distanceTo(b);
    const geometry = new BoxGeometry(thickness, thickness, length);
    geometry.lookAt(new Vector3().subVectors(b, a));
    const mid = a.add(b).multiplyScalar(0.5);
    this.add(geometry, [mid.x, mid.y, mid.z], tint);
  }

  /** Merge one layer into a single geometry. Returns null if that layer is empty. */
  build(layer: BatchLayer = "main"): BufferGeometry | null {
    const parts = this.parts[layer];
    if (parts.length === 0) return null;
    const merged = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    this.parts[layer] = [];
    merged.computeBoundingSphere();
    return merged;
  }
}
