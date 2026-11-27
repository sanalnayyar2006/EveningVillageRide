"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { CylinderGeometry, Group, Mesh, SphereGeometry, Vector3, type Material } from "three";
import { Merged } from "@/game/core/Merged";
import { PhoneModel } from "@/game/photography/PhoneModel";
import { PHOTO_CONFIG } from "@/game/photography/photoConfig";
import { useBikeStore } from "@/store/bikeStore";
import { usePhotoStore } from "@/store/photoStore";
import { MAX_DT } from "@/game/core/frameOrder";
import { damp, smoothstep } from "@/utils/math";
import { placeBetween, solveTwoBone } from "@/utils/limbs";
import { gripPosition, pedalPosition } from "./bikeGeometry";
import { RIDER_MATERIALS as mat } from "./bikeMaterials";

const LIMB = new CylinderGeometry(1, 1, 1, 10);
const JOINT = new SphereGeometry(1, 10, 8);

/** Seated rider proportions in bike space, in metres. */
const BODY = {
  pelvis: new Vector3(0, 1.07, -0.25),
  neck: new Vector3(0, 1.58, -0.08),
  thigh: 0.45,
  shin: 0.47,
  upperArm: 0.29,
  forearm: 0.3,
} as const;

const JOINTS = {
  hipLeft: BODY.pelvis.clone().add(new Vector3(0.1, 0, 0.03)),
  hipRight: BODY.pelvis.clone().add(new Vector3(-0.1, 0, 0.03)),
  shoulderLeft: BODY.neck.clone().add(new Vector3(0.18, -0.05, 0)),
  shoulderRight: BODY.neck.clone().add(new Vector3(-0.18, -0.05, 0)),
  torsoBottom: BODY.pelvis.clone().add(new Vector3(0, 0.08, 0)),
  torsoTop: BODY.neck.clone().add(new Vector3(0, -0.06, 0)),
};

// Directions the knees and elbows bend towards.
const KNEE_POLE = new Vector3(0, 0.4, 1);
const ELBOW_POLE_LEFT = new Vector3(0.7, -1, -0.4);
const ELBOW_POLE_RIGHT = new Vector3(-0.7, -1, -0.4);

/** Where the right hand goes to take the phone out, and where it holds it up to frame a shot. */
const PHONE_REACH = {
  pocket: new Vector3(-0.21, 1.0, -0.14),
  hold: new Vector3(-0.09, 1.62, 0.3),
  /** From the hand to the middle of the phone, which is held by its right edge. */
  grip: new Vector3(0.06, 0.015, 0.012),
};
/** Hide the rider once the camera is this close (m) to their head, so it never ends up inside it. */
const HIDE_DISTANCE = 0.9;

/** Feet sit slightly above the pedal axle. */
const FOOT_LIFT = 0.045;

/**
 * How the body shifts (bike space, m) out of the saddle. Standing: up and over
 * the cranks. Stopped: forward off the saddle, astride the top tube.
 */
const STANDING = new Vector3(0, 0.07, 0.12);
const STOPPED = new Vector3(0, -0.13, 0.17);
/** Side-to-side rock while standing on the pedals (m). */
const STANDING_SWAY = 0.035;
/** Climbs steeper than this (radians) get the rider out of the saddle. */
const CLIMB_PITCH = 0.05;
/** Pulling away below this speed (m/s) is done standing too. */
const PULL_AWAY_SPEED = 1.8;
/** Below this speed (m/s) the left foot comes off the pedal and down to the road. */
const STOP_SPEED = 0.3;
/** Where the left foot rests on the road, in bike space. */
const FOOT_ON_GROUND = new Vector3(0.36, 0.05, 0.0);
/** How far the stopped bike tilts onto that foot (radians). */
export const STOPPED_TILT = 0.15;
/** How quickly the rider settles into a new posture (per second). */
const POSTURE_RATE = 4;

/** Shared with BikeModel, which tilts the bike onto the rider's foot. 0..1 each. */
export const riderPosture = { standing: 0, footDown: 0 };

/**
 * The rider's eyes in bike space (heading not applied), following the body as
 * it slides off the saddle and the bike tilts onto the foot. Used by the phone camera.
 */
export function riderEye(out: Vector3): Vector3 {
  const { footDown } = riderPosture;
  const tilt = STOPPED_TILT * footDown;
  const height = PHOTO_CONFIG.eye.height + STOPPED.y * footDown;
  return out.set(
    height * Math.sin(tilt),
    height * Math.cos(tilt),
    PHOTO_CONFIG.eye.forward + STOPPED.z * footDown,
  );
}

interface LimbStyle {
  upperRadius: number;
  lowerRadius: number;
  material: Material;
  endMaterial: Material;
  endScale: [number, number, number];
}

const LEG: LimbStyle = {
  upperRadius: 0.07,
  lowerRadius: 0.05,
  material: mat.pajama,
  endMaterial: mat.sandal,
  endScale: [0.045, 0.03, 0.11],
};

const ARM: LimbStyle = {
  upperRadius: 0.048,
  lowerRadius: 0.036,
  material: mat.kurta,
  endMaterial: mat.skin,
  endScale: [0.035, 0.03, 0.045],
};

/** Children are, in order: upper segment, lower segment, joint, and hand or foot. */
function Limb({ ref, style }: { ref: React.Ref<Group>; style: LimbStyle }) {
  return (
    <group ref={ref}>
      <mesh geometry={LIMB} material={style.material} userData={{ radius: style.upperRadius }} />
      <mesh geometry={LIMB} material={style.material} userData={{ radius: style.lowerRadius }} />
      <mesh geometry={JOINT} material={style.material} scale={style.lowerRadius * 1.08} />
      <mesh geometry={JOINT} material={style.endMaterial} scale={style.endScale} />
    </group>
  );
}

const joint = new Vector3();
const end = new Vector3();
const target = new Vector3();
const grip = new Vector3();
const headWorld = new Vector3();
const bodyShift = new Vector3();
const hip = new Vector3();
const shoulder = new Vector3();
const phoneTarget = new Vector3();

/** Right-hand target for phone `raise` 0..1: handlebar → pocket → up in front of the face. */
function phoneHandTarget(raise: number, handlebar: Vector3, shift: Vector3, out: Vector3): Vector3 {
  const toPocket = smoothstep(0, 0.4, raise);
  const toFace = smoothstep(0.4, 1, raise);
  out.lerpVectors(handlebar, phoneTarget.copy(PHONE_REACH.pocket).add(shift), toPocket);
  return out.lerp(phoneTarget.copy(PHONE_REACH.hold).add(shift), toFace);
}

/** Solve the IK for one limb and move its meshes into place. */
function poseLimb(
  limb: Group | null,
  root: Vector3,
  goal: Vector3,
  upperLength: number,
  lowerLength: number,
  pole: Vector3,
) {
  const [upper, lower, jointMesh, endMesh] = limb?.children ?? [];
  if (!upper || !lower || !jointMesh || !endMesh) return;

  solveTwoBone(root, goal, upperLength, lowerLength, pole, joint, end);
  placeBetween(upper, root, joint);
  upper.scale.x = upper.scale.z = upper.userData.radius as number;
  placeBetween(lower, joint, end);
  lower.scale.x = lower.scale.z = lower.userData.radius as number;
  jointMesh.position.copy(joint);
  endMesh.position.copy(end);
}

/** A seated rider whose feet follow the pedals and hands follow the handlebar. */
export function Rider() {
  const group = useRef<Group>(null);
  const upperBody = useRef<Group>(null);
  const torso = useRef<Mesh>(null);
  const head = useRef<Group>(null);
  const legLeft = useRef<Group>(null);
  const legRight = useRef<Group>(null);
  const armLeft = useRef<Group>(null);
  const armRight = useRef<Group>(null);
  const phone = useRef<Group>(null);

  useLayoutEffect(() => {
    if (torso.current) {
      placeBetween(torso.current, JOINTS.torsoBottom, JOINTS.torsoTop);
      torso.current.scale.x = 0.17;
      torso.current.scale.z = 0.12;
    }
    group.current?.traverse((object) => {
      if ((object as Mesh).isMesh) object.castShadow = true;
    });
  }, []);

  useFrame((state, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const { crankAngle, steer, speed, pitch, pedaling } = useBikeStore.getState().telemetry;
    const { raise } = usePhotoStore.getState().rig;

    // Out of the saddle to climb or pull away; foot down once stopped.
    const climbing = pedaling && (pitch > CLIMB_PITCH || Math.abs(speed) < PULL_AWAY_SPEED);
    const stopped = !pedaling && Math.abs(speed) < STOP_SPEED;
    const settle = damp(POSTURE_RATE, dt);
    riderPosture.standing += ((climbing ? 1 : 0) - riderPosture.standing) * settle;
    riderPosture.footDown += ((stopped ? 1 : 0) - riderPosture.footDown) * settle;
    const { standing, footDown } = riderPosture;
    bodyShift.copy(STANDING).multiplyScalar(standing).addScaledVector(STOPPED, footDown);
    // Rock towards whichever pedal is pushing down.
    bodyShift.x += Math.cos(crankAngle) * STANDING_SWAY * standing;
    upperBody.current?.position.copy(bodyShift);

    pedalPosition(crankAngle, 1, target).y += FOOT_LIFT;
    target.lerp(FOOT_ON_GROUND, footDown);
    hip.copy(JOINTS.hipLeft).add(bodyShift);
    poseLimb(legLeft.current, hip, target, BODY.thigh, BODY.shin, KNEE_POLE);
    pedalPosition(crankAngle, -1, target).y += FOOT_LIFT;
    hip.copy(JOINTS.hipRight).add(bodyShift);
    poseLimb(legRight.current, hip, target, BODY.thigh, BODY.shin, KNEE_POLE);

    gripPosition(steer, 1, target);
    shoulder.copy(JOINTS.shoulderLeft).add(bodyShift);
    poseLimb(armLeft.current, shoulder, target, BODY.upperArm, BODY.forearm, ELBOW_POLE_LEFT);
    phoneHandTarget(raise, gripPosition(steer, -1, grip), bodyShift, target);
    shoulder.copy(JOINTS.shoulderRight).add(bodyShift);
    poseLimb(armRight.current, shoulder, target, BODY.upperArm, BODY.forearm, ELBOW_POLE_RIGHT);

    if (phone.current) {
      // The phone appears once the hand is in the pocket.
      phone.current.visible = raise > 0.4;
      phone.current.position.copy(armRight.current?.children[3]?.position ?? target);
      phone.current.position.add(PHONE_REACH.grip);
    }

    if (group.current && head.current) {
      head.current.getWorldPosition(headWorld);
      group.current.visible =
        raise === 0 || state.camera.position.distanceTo(headWorld) > HIDE_DISTANCE;
    }

    if (head.current) {
      // Look into turns, with a slight breathing bob.
      head.current.rotation.y = steer * 0.7;
      head.current.position.y =
        BODY.neck.y + 0.15 + Math.sin(state.clock.elapsedTime * 1.6) * 0.004;
    }
  });

  return (
    <group ref={group}>
      <group ref={upperBody}>
        {/* Kurta: torso plus a hem that flares over the hips. */}
        <mesh ref={torso} geometry={LIMB} material={mat.kurta} />
        <mesh material={mat.kurta} position={[0, 1.08, -0.22]}>
          <cylinderGeometry args={[0.17, 0.23, 0.26, 14, 1, true]} />
        </mesh>
        <mesh
          material={mat.scarf}
          position={[0, BODY.neck.y - 0.02, BODY.neck.z]}
          rotation-x={Math.PI / 2 - 0.25}
        >
          <torusGeometry args={[0.09, 0.03, 8, 16]} />
        </mesh>
        <mesh geometry={JOINT} material={mat.kurta} position={JOINTS.shoulderLeft} scale={0.065} />
        <mesh geometry={JOINT} material={mat.kurta} position={JOINTS.shoulderRight} scale={0.065} />

        <group ref={head} position={[0, BODY.neck.y + 0.15, BODY.neck.z + 0.03]}>
          <Merged>
            <mesh material={mat.skin} position={[0, -0.09, 0]}>
              <cylinderGeometry args={[0.045, 0.05, 0.08, 10]} />
            </mesh>
            <mesh material={mat.skin} scale={[0.1, 0.115, 0.105]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            <mesh material={mat.hair} position={[0, 0.025, -0.012]} scale={[0.106, 0.105, 0.11]}>
              <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            {/* Nose. */}
            <mesh material={mat.skin} position={[0, -0.01, 0.1]} scale={[0.018, 0.028, 0.025]}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </Merged>
        </group>
      </group>

      <Limb ref={legLeft} style={LEG} />
      <Limb ref={legRight} style={LEG} />
      <Limb ref={armLeft} style={ARM} />
      <Limb ref={armRight} style={ARM} />
      <PhoneModel ref={phone} />
    </group>
  );
}
