"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { CylinderGeometry, Group, Mesh, Quaternion, Vector3, type Material } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useBikeStore } from "@/store/bikeStore";
import { BIKE_CONFIG } from "./bikeConfig";
import { BIKE_POINTS, HEAD_ANGLE } from "./bikeGeometry";
import { BIKE_MATERIALS as M } from "./bikeMaterials";
import { Rider } from "./Rider";

const R = BIKE_CONFIG.wheelRadius;
const UP = new Vector3(0, 1, 0);
/** Shared unit cylinder; every tube is this mesh scaled. */
const UNIT_TUBE = new CylinderGeometry(1, 1, 1, 8);

/** A straight tube between two bike-space points. */
function Tube({
  from,
  to,
  radius,
  material = M.frame,
}: {
  from: Vector3;
  to: Vector3;
  radius: number;
  material?: Material;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new Vector3().subVectors(to, from);
    const length = dir.length();
    return {
      position: new Vector3().addVectors(from, to).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(UP, dir.normalize()),
      length,
    };
  }, [from, to]);
  return (
    <mesh
      geometry={UNIT_TUBE}
      material={material}
      position={position}
      quaternion={quaternion}
      scale={[radius, length, radius]}
    />
  );
}

/** Spokes merged into one geometry, built once for both wheels. */
const SPOKES = (() => {
  const count = 14;
  const parts = [];
  for (let i = 0; i < count; i++) {
    const g = new CylinderGeometry(0.003, 0.003, R - 0.06, 3);
    g.translate(0, (R - 0.06) / 2 + 0.03, 0);
    g.rotateX((i / count) * Math.PI * 2);
    parts.push(g);
  }
  return mergeGeometries(parts);
})();

const Wheel = ({ wheelRef }: { wheelRef: React.RefObject<Group | null> }) => (
  <group ref={wheelRef}>
    <mesh material={M.tire} rotation-y={Math.PI / 2}>
      <torusGeometry args={[R - 0.022, 0.024, 8, 32]} />
    </mesh>
    <mesh material={M.chrome} rotation-y={Math.PI / 2}>
      <torusGeometry args={[R - 0.05, 0.01, 6, 32]} />
    </mesh>
    <mesh geometry={SPOKES} material={M.chrome} />
    <mesh material={M.chrome} rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.025, 0.025, 0.1, 10]} />
    </mesh>
  </group>
);

/** Half-wrap mudguard over a wheel. `start` rotates the arc around the axle. */
const Mudguard = ({ start }: { start: number }) => (
  <mesh material={M.frame} rotation={[start, Math.PI / 2, 0, "YXZ"]}>
    <torusGeometry args={[R + 0.03, 0.03, 4, 20, Math.PI * 0.75]} />
  </mesh>
);

export function BikeModel() {
  const root = useRef<Group>(null);
  const leanGroup = useRef<Group>(null);
  const steerGroup = useRef<Group>(null);
  const rearWheel = useRef<Group>(null);
  const frontWheel = useRef<Group>(null);
  const crank = useRef<Group>(null);
  const pedalLeft = useRef<Mesh>(null);
  const pedalRight = useRef<Mesh>(null);

  const P = BIKE_POINTS;
  const pts = useMemo(() => {
    const side = (v: Vector3, x: number) => v.clone().setX(x);
    return {
      seatTop: new Vector3(0, 0.97, -0.245),
      chainstayL: side(P.bottomBracket, 0.06),
      chainstayR: side(P.bottomBracket, -0.06),
      rearL: side(P.rearAxle, 0.065),
      rearR: side(P.rearAxle, -0.065),
      seatL: side(P.seatCluster, 0.03),
      seatR: side(P.seatCluster, -0.03),
      lowerTopFront: P.headBottom.clone().add(new Vector3(0, 0.06, -0.02)),
      lowerTopBack: P.seatCluster.clone().add(new Vector3(0, -0.12, 0.03)),
      rackFront: new Vector3(0, 0.8, -0.27),
      rackBack: new Vector3(0, 0.8, -0.74),
      rackStrutL: new Vector3(0.07, 0.8, -0.62),
      rackStrutR: new Vector3(-0.07, 0.8, -0.62),
      forkTopL: new Vector3(0.05, 0, 0),
      forkTopR: new Vector3(-0.05, 0, 0),
      forkAxleL: P.forkAxleLocal.clone().setX(0.05),
      forkAxleR: P.forkAxleLocal.clone().setX(-0.05),
      stemTop: new Vector3(0, 0.37, 0),
      barL1: new Vector3(0.18, 0.375, -0.02),
      barR1: new Vector3(-0.18, 0.375, -0.02),
      gripL: new Vector3(0.29, 0.37, -0.17),
      gripR: new Vector3(-0.29, 0.37, -0.17),
    };
  }, [P]);

  useLayoutEffect(() => {
    root.current?.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = true;
    });
  }, []);

  useFrame(() => {
    const t = useBikeStore.getState().telemetry;
    if (!root.current) return;
    root.current.position.set(t.x, t.y, t.z);
    root.current.rotation.y = t.heading;
    if (leanGroup.current) leanGroup.current.rotation.z = -t.lean;
    if (steerGroup.current) steerGroup.current.rotation.y = t.steer;
    if (rearWheel.current) rearWheel.current.rotation.x = t.wheelAngle;
    if (frontWheel.current) frontWheel.current.rotation.x = t.wheelAngle;
    if (crank.current) crank.current.rotation.x = t.crankAngle;
    // Pedals stay level while the crank turns.
    if (pedalLeft.current) pedalLeft.current.rotation.x = -t.crankAngle;
    if (pedalRight.current) pedalRight.current.rotation.x = -t.crankAngle;
  });

  return (
    <group ref={root}>
      <group ref={leanGroup}>
        {/* Main frame: a classic roadster with a double top tube. */}
        <Tube from={P.bottomBracket} to={pts.seatTop} radius={0.02} />
        <Tube from={P.seatCluster} to={P.headTop} radius={0.019} />
        <Tube from={pts.lowerTopBack} to={pts.lowerTopFront} radius={0.016} />
        <Tube from={P.bottomBracket} to={P.headBottom} radius={0.022} />
        <Tube from={P.headBottom} to={P.headTop} radius={0.026} />
        <Tube from={pts.chainstayL} to={pts.rearL} radius={0.012} />
        <Tube from={pts.chainstayR} to={pts.rearR} radius={0.012} />
        <Tube from={pts.seatL} to={pts.rearL} radius={0.011} />
        <Tube from={pts.seatR} to={pts.rearR} radius={0.011} />

        {/* Saddle with its coil springs. */}
        <mesh material={M.saddle} position={P.saddle} scale={[0.1, 0.035, 0.15]}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        <Tube from={pts.seatTop} to={P.saddle} radius={0.012} material={M.chrome} />

        {/* Rear carrier. */}
        <mesh material={M.frame} position={[0, 0.8, -0.5]}>
          <boxGeometry args={[0.16, 0.012, 0.48]} />
        </mesh>
        <Tube from={pts.rackStrutL} to={pts.rearL} radius={0.008} />
        <Tube from={pts.rackStrutR} to={pts.rearR} radius={0.008} />
        <Tube from={pts.rackFront} to={P.seatCluster} radius={0.008} />

        {/* Chain guard. */}
        <mesh
          material={M.frame}
          position={[-0.085, 0.31, -0.28]}
          rotation-x={Math.atan2(
            P.rearAxle.y - P.bottomBracket.y,
            P.bottomBracket.z - P.rearAxle.z,
          )}
        >
          <boxGeometry args={[0.01, 0.16, 0.62]} />
        </mesh>

        <group position={P.rearAxle}>
          <Wheel wheelRef={rearWheel} />
          <Mudguard start={-0.15} />
          <mesh material={M.reflector} position={[0, 0.72 - R, -0.25]}>
            <boxGeometry args={[0.05, 0.03, 0.01]} />
          </mesh>
        </group>

        {/* Crank set. */}
        <group ref={crank} position={P.bottomBracket}>
          <mesh material={M.chrome} position-x={-0.075} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.095, 0.095, 0.008, 24]} />
          </mesh>
          <mesh material={M.chrome} position={[-P.pedalOffset + 0.02, -P.crankLength / 2, 0]}>
            <boxGeometry args={[0.012, P.crankLength, 0.022]} />
          </mesh>
          <mesh material={M.chrome} position={[P.pedalOffset - 0.02, P.crankLength / 2, 0]}>
            <boxGeometry args={[0.012, P.crankLength, 0.022]} />
          </mesh>
          <mesh ref={pedalRight} material={M.rubber} position={[-P.pedalOffset, -P.crankLength, 0]}>
            <boxGeometry args={[0.09, 0.02, 0.06]} />
          </mesh>
          <mesh ref={pedalLeft} material={M.rubber} position={[P.pedalOffset, P.crankLength, 0]}>
            <boxGeometry args={[0.09, 0.02, 0.06]} />
          </mesh>
        </group>

        {/* Steering assembly, tilted along the head tube axis. */}
        <group position={P.headBottom} rotation-x={-HEAD_ANGLE}>
          <group ref={steerGroup}>
            <Tube from={pts.forkTopL} to={pts.forkAxleL} radius={0.013} />
            <Tube from={pts.forkTopR} to={pts.forkAxleR} radius={0.013} />
            <Tube
              from={new Vector3(0, 0.18, 0)}
              to={pts.stemTop}
              radius={0.014}
              material={M.chrome}
            />
            <Tube from={pts.stemTop} to={pts.barL1} radius={0.011} material={M.chrome} />
            <Tube from={pts.stemTop} to={pts.barR1} radius={0.011} material={M.chrome} />
            <Tube from={pts.barL1} to={pts.gripL} radius={0.011} material={M.chrome} />
            <Tube from={pts.barR1} to={pts.gripR} radius={0.011} material={M.chrome} />
            <Tube
              from={pts.gripL.clone().add(new Vector3(0.03, 0, 0.02))}
              to={pts.gripL.clone().add(new Vector3(-0.03, 0, -0.06))}
              radius={0.016}
              material={M.rubber}
            />
            <Tube
              from={pts.gripR.clone().add(new Vector3(-0.03, 0, 0.02))}
              to={pts.gripR.clone().add(new Vector3(0.03, 0, -0.06))}
              radius={0.016}
              material={M.rubber}
            />
            {/* Bell on the left bar. */}
            <mesh material={M.chrome} position={[0.17, 0.4, -0.02]}>
              <sphereGeometry args={[0.028, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            {/* Headlamp. */}
            <mesh
              material={M.chrome}
              position={[0, 0.12, 0.06]}
              rotation-x={Math.PI / 2 + HEAD_ANGLE}
            >
              <cylinderGeometry args={[0.04, 0.03, 0.06, 12]} />
            </mesh>
            <group position={P.forkAxleLocal} rotation-x={HEAD_ANGLE}>
              <Wheel wheelRef={frontWheel} />
              <Mudguard start={0.55} />
            </group>
          </group>
        </group>

        <Rider />
      </group>
    </group>
  );
}
