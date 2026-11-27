import type { DetailGroup } from "./DetailCells";
import {
  Color,
  Euler,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";

export interface InstanceSpec {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale: number;
  /** Multiplies the geometry's vertex colours; white leaves them unchanged. */
  tint: Color;
}

const matrix = new Matrix4();
const quaternion = new Quaternion();
const euler = new Euler();
const position = new Vector3();
const scale = new Vector3();

/** Builds one InstancedMesh drawing `geometry` at every spec, in a single draw call. */
function createInstances(
  geometry: BufferGeometry,
  material: Material,
  specs: InstanceSpec[],
  castShadow: boolean,
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, specs.length);
  specs.forEach((spec, i) => {
    quaternion.setFromEuler(euler.set(0, spec.rotationY, 0));
    matrix.compose(position.set(spec.x, spec.y, spec.z), quaternion, scale.setScalar(spec.scale));
    mesh.setMatrixAt(i, matrix);
    mesh.setColorAt(i, spec.tint);
  });
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** How one kind of instance is drawn at each distance (see DetailCells). */
export interface DetailedShape {
  name: string;
  near: BufferGeometry;
  /** Simpler geometry for far away, or null to draw nothing there. */
  far: BufferGeometry | null;
  material: Material;
  /** Only the near version casts shadows: the shadow map covers just the area round the rider. */
  castShadow: boolean;
  farFrom: number;
  hideFrom: number;
}

/**
 * Splits instances into square cells `cellSize` metres across, one
 * InstancedMesh each with tight bounds, plus one far-off stand-in mesh with
 * room for all of them (DetailCells fills it with whichever cells are far).
 */
export function createDetailGroup(
  shape: DetailedShape,
  specs: InstanceSpec[],
  cellSize: number,
): DetailGroup {
  const groups = new Map<string, InstanceSpec[]>();
  for (const spec of specs) {
    const key = `${Math.floor(spec.x / cellSize)},${Math.floor(spec.z / cellSize)}`;
    const group = groups.get(key);
    if (group) group.push(spec);
    else groups.set(key, [spec]);
  }

  const cells = [...groups.values()].map((group) => {
    const near = createInstances(shape.near, shape.material, group, shape.castShadow);
    near.name = shape.name;
    return {
      minX: Math.min(...group.map((s) => s.x)),
      maxX: Math.max(...group.map((s) => s.x)),
      minZ: Math.min(...group.map((s) => s.z)),
      maxZ: Math.max(...group.map((s) => s.z)),
      near,
    };
  });

  let far: InstancedMesh | null = null;
  if (shape.far) {
    far = createInstances(shape.far, shape.material, specs, false);
    far.name = `${shape.name}:far`;
    far.count = 0;
    far.visible = false;
  }
  return { cells, far, farFrom: shape.farFrom, hideFrom: shape.hideFrom };
}
