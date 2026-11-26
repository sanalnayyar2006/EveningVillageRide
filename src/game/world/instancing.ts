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
export function createInstances(
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
