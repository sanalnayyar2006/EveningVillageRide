import {
  Color,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
} from "three";

/**
 * Creatures are drawn with one InstancedMesh per body part ("leg", "head"...),
 * shared by every creature of a kind. Each frame, every creature writes the
 * world matrix of each of its parts, so a whole crowd costs a few draw calls.
 */

/** Vertex-coloured, so baked details (eyes, hooves) survive the per-instance tint. */
const CREATURE_MATERIAL = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });

export interface PartDef {
  geometry: BufferGeometry;
  /** Most instances this part can have at once. */
  capacity: number;
  /** Small parts (hands, hair, tools) don't need their own shadow draw call. */
  noShadow?: boolean;
}

export class PartSet<Part extends string> {
  readonly meshes: InstancedMesh[];
  private byName: Record<Part, InstancedMesh>;
  private counts: Record<Part, number>;

  constructor(defs: Record<Part, PartDef>, castShadow = true) {
    const names = Object.keys(defs) as Part[];
    this.byName = {} as Record<Part, InstancedMesh>;
    this.counts = {} as Record<Part, number>;
    for (const name of names) {
      const mesh = new InstancedMesh(defs[name].geometry, CREATURE_MATERIAL, defs[name].capacity);
      mesh.castShadow = castShadow && !defs[name].noShadow;
      mesh.receiveShadow = true;
      // Instances move every frame, so a fixed bounding sphere would cull them wrongly.
      mesh.frustumCulled = false;
      mesh.name = name;
      this.byName[name] = mesh;
      this.counts[name] = 0;
    }
    this.meshes = names.map((name) => this.byName[name]);
  }

  /** Start writing a new frame. */
  begin(): void {
    for (const name of Object.keys(this.counts) as Part[]) this.counts[name] = 0;
  }

  place(part: Part, matrix: Matrix4, color: Color): void {
    const mesh = this.byName[part];
    const index = this.counts[part]++;
    if (index >= mesh.instanceMatrix.count) return;
    mesh.setMatrixAt(index, matrix);
    mesh.setColorAt(index, color);
  }

  /** Finish the frame: only the instances written this frame are drawn. */
  end(): void {
    for (const name of Object.keys(this.byName) as Part[]) {
      const mesh = this.byName[name];
      mesh.count = Math.min(this.counts[name], mesh.instanceMatrix.count);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const mesh of this.meshes) {
      mesh.geometry.dispose();
      mesh.dispose();
    }
  }
}

const euler = new Euler();
const quaternion = new Quaternion();
const offset = new Vector3();
const scale = new Vector3();
const local = new Matrix4();

/**
 * `out = parent × translate(x, y, z) × rotate(rx, ry, rz) × scale`.
 * The building block for posing joints: limbs hang from their parent's pivot.
 */
export function joint(
  out: Matrix4,
  parent: Matrix4,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  s = 1,
): Matrix4 {
  quaternion.setFromEuler(euler.set(rx, ry, rz, "YXZ"));
  local.compose(offset.set(x, y, z), quaternion, scale.setScalar(s));
  return out.multiplyMatrices(parent, local);
}

/** A creature's root: standing at (x, y, z), facing `heading` (bike convention), uniformly scaled. */
export function root(
  out: Matrix4,
  x: number,
  y: number,
  z: number,
  heading: number,
  s = 1,
): Matrix4 {
  quaternion.setFromEuler(euler.set(0, heading, 0));
  return out.compose(offset.set(x, y, z), quaternion, scale.setScalar(s));
}
