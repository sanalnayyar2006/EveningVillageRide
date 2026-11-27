"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { CylinderGeometry, Group, Mesh, Quaternion, Vector3, type Material } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Merged } from "@/game/core/Merged";
import { useBikeStore } from "@/store/bikeStore";
import { BIKE_CONFIG } from "./bikeConfig";
import { BIKE_POINTS, GRIP_LOCAL, HEAD_ANGLE } from "./bikeGeometry";
import { BIKE_MATERIALS as mat } from "./bikeMaterials";
import { Rider, riderPosture, STOPPED_TILT } from "./Rider";

const WHEEL_RADIUS = BIKE_CONFIG.wheelRadius;
const UP = new Vector3(0, 1, 0);
/** Every tube is this one cylinder, scaled and rotated into place. */
const UNIT_TUBE = new CylinderGeometry(1, 1, 1, 8);

const P = BIKE_POINTS;
const at = (x: number, y: number, z: number) => new Vector3(x, y, z);
const withX = (v: Vector3, x: number) => v.clone().setX(x);
const offset = (v: Vector3, x: number, y: number, z: number) => v.clone().add(at(x, y, z));

/** Extra points for the frame, carrier and handlebars (bike space unless noted). */
const POINTS = {
  seatPostTop: at(0, 0.97, -0.245),
  chainstayLeft: withX(P.bottomBracket, 0.06),
  chainstayRight: withX(P.bottomBracket, -0.06),
  rearDropoutLeft: withX(P.rearAxle, 0.065),
  rearDropoutRight: withX(P.rearAxle, -0.065),
  seatstayLeft: withX(P.seatCluster, 0.03),
  seatstayRight: withX(P.seatCluster, -0.03),
  lowerTopTubeFront: offset(P.headBottom, 0, 0.06, -0.02),
  lowerTopTubeBack: offset(P.seatCluster, 0, -0.12, 0.03),
  rackFront: at(0, 0.8, -0.27),
  rackStrutLeft: at(0.07, 0.8, -0.62),
  rackStrutRight: at(-0.07, 0.8, -0.62),
  // The rest are inside the tilted steering assembly.
  forkTopLeft: at(0.05, 0, 0),
  forkTopRight: at(-0.05, 0, 0),
  forkAxleLeft: withX(P.forkAxleLocal, 0.05),
  forkAxleRight: withX(P.forkAxleLocal, -0.05),
  stemBottom: at(0, 0.18, 0),
  stemTop: at(0, 0.37, 0),
  barBendLeft: at(0.18, 0.375, -0.02),
  barBendRight: at(-0.18, 0.375, -0.02),
  gripLeft: GRIP_LOCAL.clone(),
  gripRight: withX(GRIP_LOCAL, -GRIP_LOCAL.x),
};

/** A straight tube between two points. */
function Tube({
  from,
  to,
  radius,
  material = mat.frame,
}: {
  from: Vector3;
  to: Vector3;
  radius: number;
  material?: Material;
}) {
  const transform = useMemo(() => {
    const direction = new Vector3().subVectors(to, from);
    return {
      position: new Vector3().addVectors(from, to).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
      length: direction.length(),
    };
  }, [from, to]);

  return (
    <mesh
      geometry={UNIT_TUBE}
      material={material}
      position={transform.position}
      quaternion={transform.quaternion}
      scale={[radius, transform.length, radius]}
    />
  );
}

/** All 14 spokes merged into one geometry, shared by both wheels. */
const SPOKES = (() => {
  const count = 14;
  const hubRadius = 0.03;
  const length = WHEEL_RADIUS - 0.06;
  const spokes = [];
  for (let i = 0; i < count; i++) {
    const spoke = new CylinderGeometry(0.003, 0.003, length, 3);
    spoke.translate(0, length / 2 + hubRadius, 0);
    spoke.rotateX((i / count) * Math.PI * 2);
    spokes.push(spoke);
  }
  return mergeGeometries(spokes);
})();

function Wheel({ wheelRef }: { wheelRef: React.Ref<Group> }) {
  return (
    <group ref={wheelRef}>
      <Merged>
        <mesh material={mat.tire} rotation-y={Math.PI / 2}>
          <torusGeometry args={[WHEEL_RADIUS - 0.022, 0.024, 8, 32]} />
        </mesh>
        <mesh material={mat.chrome} rotation-y={Math.PI / 2}>
          <torusGeometry args={[WHEEL_RADIUS - 0.05, 0.01, 6, 32]} />
        </mesh>
        <mesh geometry={SPOKES} material={mat.chrome} />
        <mesh material={mat.chrome} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.025, 0.025, 0.1, 10]} />
        </mesh>
      </Merged>
    </group>
  );
}

/** A mudguard covering 3/4 of a turn around the axle, starting at `startAngle`. */
function Mudguard({ startAngle }: { startAngle: number }) {
  return (
    <mesh material={mat.frame} rotation={[startAngle, Math.PI / 2, 0, "YXZ"]}>
      <torusGeometry args={[WHEEL_RADIUS + 0.03, 0.03, 4, 20, Math.PI * 0.75]} />
    </mesh>
  );
}

const CHAIN_GUARD_TILT = Math.atan2(
  P.rearAxle.y - P.bottomBracket.y,
  P.bottomBracket.z - P.rearAxle.z,
);

/** A classic black roadster with its rider, posed every frame from the bike store. */
export function BikeModel() {
  const root = useRef<Group>(null);
  const pitchGroup = useRef<Group>(null);
  const leanGroup = useRef<Group>(null);
  const steerGroup = useRef<Group>(null);
  const rearWheel = useRef<Group>(null);
  const frontWheel = useRef<Group>(null);
  const crank = useRef<Group>(null);
  const pedalLeft = useRef<Mesh>(null);
  const pedalRight = useRef<Mesh>(null);

  useLayoutEffect(() => {
    root.current?.traverse((object) => {
      if ((object as Mesh).isMesh) object.castShadow = true;
    });
  }, []);

  useFrame(() => {
    const bike = useBikeStore.getState().telemetry;
    root.current?.position.set(bike.x, bike.y, bike.z);
    if (root.current) root.current.rotation.y = bike.heading;
    if (pitchGroup.current) pitchGroup.current.rotation.x = -bike.pitch;
    // Stopped, the bike rests tilted onto the rider's left foot.
    if (leanGroup.current) {
      leanGroup.current.rotation.z = -bike.lean - STOPPED_TILT * riderPosture.footDown;
    }
    if (steerGroup.current) steerGroup.current.rotation.y = bike.steer;
    if (rearWheel.current) rearWheel.current.rotation.x = bike.wheelAngle;
    if (frontWheel.current) frontWheel.current.rotation.x = bike.wheelAngle;
    if (crank.current) crank.current.rotation.x = bike.crankAngle;
    // Counter-rotate the pedals so they stay level as the crank turns.
    if (pedalLeft.current) pedalLeft.current.rotation.x = -bike.crankAngle;
    if (pedalRight.current) pedalRight.current.rotation.x = -bike.crankAngle;
  });

  return (
    <group ref={root}>
      <group ref={pitchGroup}>
        <group ref={leanGroup}>
          <Merged>
            {/* Frame, with the double top tube typical of a roadster. */}
            <Tube from={P.bottomBracket} to={POINTS.seatPostTop} radius={0.02} />
            <Tube from={P.seatCluster} to={P.headTop} radius={0.019} />
            <Tube from={POINTS.lowerTopTubeBack} to={POINTS.lowerTopTubeFront} radius={0.016} />
            <Tube from={P.bottomBracket} to={P.headBottom} radius={0.022} />
            <Tube from={P.headBottom} to={P.headTop} radius={0.026} />
            <Tube from={POINTS.chainstayLeft} to={POINTS.rearDropoutLeft} radius={0.012} />
            <Tube from={POINTS.chainstayRight} to={POINTS.rearDropoutRight} radius={0.012} />
            <Tube from={POINTS.seatstayLeft} to={POINTS.rearDropoutLeft} radius={0.011} />
            <Tube from={POINTS.seatstayRight} to={POINTS.rearDropoutRight} radius={0.011} />

            {/* Saddle. */}
            <mesh material={mat.saddle} position={P.saddle} scale={[0.1, 0.035, 0.15]}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
            <Tube from={POINTS.seatPostTop} to={P.saddle} radius={0.012} material={mat.chrome} />

            {/* Rear carrier. */}
            <mesh material={mat.frame} position={[0, 0.8, -0.5]}>
              <boxGeometry args={[0.16, 0.012, 0.48]} />
            </mesh>
            <Tube from={POINTS.rackStrutLeft} to={POINTS.rearDropoutLeft} radius={0.008} />
            <Tube from={POINTS.rackStrutRight} to={POINTS.rearDropoutRight} radius={0.008} />
            <Tube from={POINTS.rackFront} to={P.seatCluster} radius={0.008} />

            {/* Chain guard. */}
            <mesh
              material={mat.frame}
              position={[-0.085, 0.31, -0.28]}
              rotation-x={CHAIN_GUARD_TILT}
            >
              <boxGeometry args={[0.01, 0.16, 0.62]} />
            </mesh>

            <group position={P.rearAxle}>
              <Mudguard startAngle={-0.15} />
              <mesh material={mat.reflector} position={[0, 0.72 - WHEEL_RADIUS, -0.25]}>
                <boxGeometry args={[0.05, 0.03, 0.01]} />
              </mesh>
            </group>
          </Merged>

          <group position={P.rearAxle}>
            <Wheel wheelRef={rearWheel} />
          </group>

          {/* Chainring, crank arms and pedals. */}
          <group ref={crank} position={P.bottomBracket}>
            <Merged>
              <mesh material={mat.chrome} position-x={-0.075} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.095, 0.095, 0.008, 24]} />
              </mesh>
              <mesh material={mat.chrome} position={[-P.pedalOffset + 0.02, -P.crankLength / 2, 0]}>
                <boxGeometry args={[0.012, P.crankLength, 0.022]} />
              </mesh>
              <mesh material={mat.chrome} position={[P.pedalOffset - 0.02, P.crankLength / 2, 0]}>
                <boxGeometry args={[0.012, P.crankLength, 0.022]} />
              </mesh>
            </Merged>
            <mesh
              ref={pedalRight}
              material={mat.rubber}
              position={[-P.pedalOffset, -P.crankLength, 0]}
            >
              <boxGeometry args={[0.09, 0.02, 0.06]} />
            </mesh>
            <mesh
              ref={pedalLeft}
              material={mat.rubber}
              position={[P.pedalOffset, P.crankLength, 0]}
            >
              <boxGeometry args={[0.09, 0.02, 0.06]} />
            </mesh>
          </group>

          {/* Steering assembly: tilted to the head tube angle, then turned by the steer angle. */}
          <group position={P.headBottom} rotation-x={-HEAD_ANGLE}>
            <group ref={steerGroup}>
              <Merged>
                <Tube from={POINTS.forkTopLeft} to={POINTS.forkAxleLeft} radius={0.013} />
                <Tube from={POINTS.forkTopRight} to={POINTS.forkAxleRight} radius={0.013} />
                <Tube
                  from={POINTS.stemBottom}
                  to={POINTS.stemTop}
                  radius={0.014}
                  material={mat.chrome}
                />
                <Handlebar side={1} />
                <Handlebar side={-1} />
                {/* Bell, on the left of the bar. */}
                <mesh material={mat.chrome} position={[0.17, 0.4, -0.02]}>
                  <sphereGeometry args={[0.028, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                </mesh>
                {/* Headlamp. */}
                <mesh
                  material={mat.chrome}
                  position={[0, 0.12, 0.06]}
                  rotation-x={Math.PI / 2 + HEAD_ANGLE}
                >
                  <cylinderGeometry args={[0.04, 0.03, 0.06, 12]} />
                </mesh>
                {/* Undo the head tilt so the front wheel stands upright. */}
                <group position={P.forkAxleLocal} rotation-x={HEAD_ANGLE}>
                  <Mudguard startAngle={0.55} />
                </group>
              </Merged>
              <group position={P.forkAxleLocal} rotation-x={HEAD_ANGLE}>
                <Wheel wheelRef={frontWheel} />
              </group>
            </group>
          </group>

          <Rider />
        </group>
      </group>
    </group>
  );
}

/** One half of the handlebar with its rubber grip. side: 1 = left, -1 = right. */
function Handlebar({ side }: { side: 1 | -1 }) {
  const bend = side === 1 ? POINTS.barBendLeft : POINTS.barBendRight;
  const grip = side === 1 ? POINTS.gripLeft : POINTS.gripRight;
  const gripEnds = useMemo(
    () => [offset(grip, 0.03 * side, 0, 0.02), offset(grip, -0.03 * side, 0, -0.06)] as const,
    [grip, side],
  );
  return (
    <>
      <Tube from={POINTS.stemTop} to={bend} radius={0.011} material={mat.chrome} />
      <Tube from={bend} to={grip} radius={0.011} material={mat.chrome} />
      <Tube from={gripEnds[0]} to={gripEnds[1]} radius={0.016} material={mat.rubber} />
    </>
  );
}
