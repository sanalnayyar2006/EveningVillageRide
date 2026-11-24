import { Vector3, type Object3D } from "three";

const UP = new Vector3(0, 1, 0);
const tmpDir = new Vector3();
const tmpPole = new Vector3();

/**
 * Stretch a unit-height, Y-aligned mesh (e.g. a cylinder of height 1) so it
 * spans from `a` to `b`. Coordinates are in the object's parent space.
 */
export function placeBetween(object: Object3D, a: Vector3, b: Vector3): void {
  tmpDir.subVectors(b, a);
  const length = tmpDir.length();
  object.position.addVectors(a, b).multiplyScalar(0.5);
  if (length > 1e-6) object.quaternion.setFromUnitVectors(UP, tmpDir.divideScalar(length));
  object.scale.set(1, length, 1);
}

/**
 * Two-bone IK. Writes the middle joint (knee / elbow) into `outJoint` and the
 * reachable end point into `outEnd`. `pole` is the direction the joint bends towards.
 */
export function solveTwoBone(
  root: Vector3,
  target: Vector3,
  upperLength: number,
  lowerLength: number,
  pole: Vector3,
  outJoint: Vector3,
  outEnd: Vector3,
): void {
  tmpDir.subVectors(target, root);
  const rawDistance = tmpDir.length() || 1e-6;
  tmpDir.divideScalar(rawDistance);
  const distance = Math.min(
    Math.max(rawDistance, Math.abs(upperLength - lowerLength) + 1e-3),
    upperLength + lowerLength - 1e-3,
  );
  const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(upperLength ** 2 - along ** 2, 0));

  tmpPole.copy(pole).addScaledVector(tmpDir, -pole.dot(tmpDir));
  if (tmpPole.lengthSq() < 1e-8) tmpPole.set(0, 0, 1);
  tmpPole.normalize();

  outJoint.copy(root).addScaledVector(tmpDir, along).addScaledVector(tmpPole, height);
  outEnd.copy(root).addScaledVector(tmpDir, distance);
}
