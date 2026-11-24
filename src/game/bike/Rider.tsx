"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { CylinderGeometry, Group, Mesh, SphereGeometry, Vector3 } from "three";
import { useBikeStore } from "@/store/bikeStore";
import { placeBetween, solveTwoBone } from "@/utils/limbs";
import { gripPosition, pedalPosition } from "./bikeGeometry";
import { RIDER_MATERIALS as M } from "./bikeMaterials";

const LIMB = new CylinderGeometry(1, 1, 1, 10);
const JOINT = new SphereGeometry(1, 10, 8);

const BODY = {
  pelvis: new Vector3(0, 1.07, -0.25),
  neck: new Vector3(0, 1.58, -0.08),
  hipWidth: 0.1,
  shoulderWidth: 0.18,
  thigh: 0.45,
  shin: 0.47,
  upperArm: 0.29,
  forearm: 0.3,
} as const;

const KNEE_POLE = new Vector3(0, 0.4, 1);
const ELBOW_POLE_L = new Vector3(0.7, -1, -0.4);
const ELBOW_POLE_R = new Vector3(-0.7, -1, -0.4);

/** Limb children, in order: upper segment, lower segment, joint, end (hand / foot). */
function LimbMeshes({
  ref,
  upperRadius,
  lowerRadius,
  material,
  endMaterial,
  endScale,
}: {
  ref: React.Ref<Group>;
  upperRadius: number;
  lowerRadius: number;
  material: Mesh["material"];
  endMaterial: Mesh["material"];
  endScale: [number, number, number];
}) {
  return (
    <group ref={ref}>
      <mesh geometry={LIMB} material={material} userData={{ radius: upperRadius }} />
      <mesh geometry={LIMB} material={material} userData={{ radius: lowerRadius }} />
      <mesh geometry={JOINT} material={material} scale={lowerRadius * 1.08} />
      <mesh geometry={JOINT} material={endMaterial} scale={endScale} />
    </group>
  );
}

const scratch = {
  root: new Vector3(),
  target: new Vector3(),
  joint: new Vector3(),
  end: new Vector3(),
};

function poseLimb(
  limb: Group | null,
  root: Vector3,
  target: Vector3,
  upperLength: number,
  lowerLength: number,
  pole: Vector3,
) {
  if (!limb) return;
  solveTwoBone(root, target, upperLength, lowerLength, pole, scratch.joint, scratch.end);
  const [upper, lower, joint, end] = limb.children;
  if (!upper || !lower || !joint || !end) return;
  placeBetween(upper, root, scratch.joint);
  upper.scale.x = upper.scale.z = upper.userData.radius as number;
  placeBetween(lower, scratch.joint, scratch.end);
  lower.scale.x = lower.scale.z = lower.userData.radius as number;
  joint.position.copy(scratch.joint);
  end.position.copy(scratch.end);
}

/** A seated rider whose feet follow the pedals and hands follow the handlebar. */
export function Rider() {
  const group = useRef<Group>(null);
  const head = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);

  const fixed = useMemo(() => {
    const torsoBottom = BODY.pelvis.clone().add(new Vector3(0, 0.08, 0));
    const torsoTop = BODY.neck.clone().add(new Vector3(0, -0.06, 0));
    return {
      torsoBottom,
      torsoTop,
      hipL: BODY.pelvis.clone().add(new Vector3(BODY.hipWidth, 0, 0.03)),
      hipR: BODY.pelvis.clone().add(new Vector3(-BODY.hipWidth, 0, 0.03)),
      shoulderL: BODY.neck.clone().add(new Vector3(BODY.shoulderWidth, -0.05, 0)),
      shoulderR: BODY.neck.clone().add(new Vector3(-BODY.shoulderWidth, -0.05, 0)),
    };
  }, []);
  const torso = useRef<Mesh>(null);

  useLayoutEffect(() => {
    if (torso.current) {
      placeBetween(torso.current, fixed.torsoBottom, fixed.torsoTop);
      torso.current.scale.x = 0.17;
      torso.current.scale.z = 0.12;
    }
    group.current?.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = true;
    });
  }, [fixed]);

  useFrame((state) => {
    const t = useBikeStore.getState().telemetry;
    const { root, target } = scratch;

    pedalPosition(t.crankAngle, 1, target).y += 0.045;
    poseLimb(legL.current, root.copy(fixed.hipL), target, BODY.thigh, BODY.shin, KNEE_POLE);
    pedalPosition(t.crankAngle, -1, target).y += 0.045;
    poseLimb(legR.current, root.copy(fixed.hipR), target, BODY.thigh, BODY.shin, KNEE_POLE);

    gripPosition(t.steer, 1, target);
    poseLimb(
      armL.current,
      root.copy(fixed.shoulderL),
      target,
      BODY.upperArm,
      BODY.forearm,
      ELBOW_POLE_L,
    );
    gripPosition(t.steer, -1, target);
    poseLimb(
      armR.current,
      root.copy(fixed.shoulderR),
      target,
      BODY.upperArm,
      BODY.forearm,
      ELBOW_POLE_R,
    );

    if (head.current) {
      // Glance into turns, with a gentle breathing bob.
      head.current.rotation.y = t.steer * 0.7;
      head.current.position.y =
        BODY.neck.y + 0.15 + Math.sin(state.clock.elapsedTime * 1.6) * 0.004;
    }
  });

  return (
    <group ref={group}>
      {/* Torso in a kurta, flaring at the hem. */}
      <mesh ref={torso} geometry={LIMB} material={M.kurta} />
      <mesh material={M.kurta} position={[0, 1.08, -0.22]}>
        <cylinderGeometry args={[0.17, 0.23, 0.26, 14, 1, true]} />
      </mesh>
      <mesh
        material={M.scarf}
        position={[0, BODY.neck.y - 0.02, BODY.neck.z]}
        rotation-x={Math.PI / 2 - 0.25}
      >
        <torusGeometry args={[0.09, 0.03, 8, 16]} />
      </mesh>
      {[fixed.shoulderL, fixed.shoulderR].map((p, i) => (
        <mesh key={i} geometry={JOINT} material={M.kurta} position={p} scale={0.065} />
      ))}

      <group ref={head} position={[0, BODY.neck.y + 0.15, BODY.neck.z + 0.03]}>
        <mesh material={M.skin} position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.08, 10]} />
        </mesh>
        <mesh material={M.skin} scale={[0.1, 0.115, 0.105]}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh material={M.hair} position={[0, 0.025, -0.012]} scale={[0.106, 0.105, 0.11]}>
          <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={M.skin} position={[0, -0.01, 0.1]} scale={[0.018, 0.028, 0.025]}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      </group>

      <LimbMeshes
        ref={legL}
        upperRadius={0.07}
        lowerRadius={0.05}
        material={M.pajama}
        endMaterial={M.sandal}
        endScale={[0.045, 0.03, 0.11]}
      />
      <LimbMeshes
        ref={legR}
        upperRadius={0.07}
        lowerRadius={0.05}
        material={M.pajama}
        endMaterial={M.sandal}
        endScale={[0.045, 0.03, 0.11]}
      />
      <LimbMeshes
        ref={armL}
        upperRadius={0.048}
        lowerRadius={0.036}
        material={M.kurta}
        endMaterial={M.skin}
        endScale={[0.035, 0.03, 0.045]}
      />
      <LimbMeshes
        ref={armR}
        upperRadius={0.048}
        lowerRadius={0.036}
        material={M.kurta}
        endMaterial={M.skin}
        endScale={[0.035, 0.03, 0.045]}
      />
    </group>
  );
}
