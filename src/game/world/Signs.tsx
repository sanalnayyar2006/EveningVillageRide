"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide, type Mesh } from "three";
import { createSignTexture } from "./canvasText";
import { localToWorld } from "./data/geometry";
import { px } from "./data/mapSource";
import {
  BUS_STOP,
  GATE,
  HOSPITAL,
  SCHOOL,
  SUBSTATION,
  TEA_STALL,
  TEMPLE,
  type Placement,
} from "./data/structures";
import { BUS_STOP_SIGN } from "./landmarks/busStop";
import { GATE_SIGN_Y } from "./landmarks/gate";
import { HOSPITAL_SIGN } from "./landmarks/hospital";
import { SCHOOL_SIGN } from "./landmarks/school";
import { SUBSTATION_SIGN } from "./landmarks/substation";
import { TEA_STALL_SIGN } from "./landmarks/teaStall";
import { TEMPLE_SPIRE_TOP } from "./landmarks/temple";
import { heightAt } from "./terrain";
import { PALETTE } from "./worldMaterials";

interface SignSpec {
  /** The landmark the sign belongs to; `local` and `turn` are relative to it. */
  anchor: Placement;
  local: [number, number, number];
  /** Extra turn on top of the anchor's; π for a board facing out of the back. */
  turn?: number;
  width: number;
  height: number;
  lines: string[];
  background: string;
  color: string;
}

/** Where the direction sign stands, beside the village road just inside the gate. */
const SIGNPOST = (() => {
  const [x, z] = px(694, 660);
  return { x, z, rot: 0 };
})();

const SIGNS: SignSpec[] = [
  {
    anchor: GATE,
    local: [0, GATE_SIGN_Y, 0.31],
    width: 6.2,
    height: 0.7,
    lines: ["स्वागत है  ·  WELCOME"],
    background: "#9c2a17",
    color: "#ffe08a",
  },
  {
    anchor: GATE,
    local: [0, GATE_SIGN_Y, -0.31],
    turn: Math.PI,
    width: 6.2,
    height: 0.7,
    lines: ["फिर आइएगा  ·  COME AGAIN"],
    background: "#9c2a17",
    color: "#ffe08a",
  },
  {
    anchor: BUS_STOP,
    local: BUS_STOP_SIGN,
    width: 0.7,
    height: 0.45,
    lines: ["बस स्टॉप", "BUS STOP"],
    background: "#1f5f8b",
    color: "#ffffff",
  },
  {
    anchor: TEA_STALL,
    local: TEA_STALL_SIGN,
    width: 2.8,
    height: 0.55,
    lines: ["चाय  ·  Ramu Tea Stall"],
    background: "#f2c230",
    color: "#5a1d0e",
  },
  {
    anchor: SCHOOL,
    local: SCHOOL_SIGN,
    width: 7,
    height: 0.85,
    lines: ["राजकीय प्राथमिक विद्यालय", "Government Primary School"],
    background: "#f7f1e3",
    color: "#1f3b8c",
  },
  {
    anchor: HOSPITAL,
    local: HOSPITAL_SIGN,
    width: 6,
    height: 0.7,
    lines: ["अस्पताल  ·  HOSPITAL"],
    background: "#ffffff",
    color: "#c8232c",
  },
  {
    anchor: SUBSTATION,
    local: SUBSTATION_SIGN,
    turn: Math.PI,
    width: 1.4,
    height: 0.7,
    lines: ["खतरा  ·  DANGER", "220 kV"],
    background: "#f4d23c",
    color: "#b3151b",
  },
  {
    anchor: SIGNPOST,
    local: [0, 2.2, 0.05],
    width: 1.6,
    height: 0.6,
    lines: ["↑ मंदिर  Temple", "← बाज़ार  Market"],
    background: "#2f6b3a",
    color: "#ffffff",
  },
];

/** A local point on a landmark, in world space, standing on the ground under the landmark. */
function worldPoint(
  anchor: Placement,
  [lx, ly, lz]: [number, number, number],
): [number, number, number] {
  const [x, z] = localToWorld(anchor.x, anchor.z, anchor.rot, lx, lz);
  return [x, heightAt(anchor.x, anchor.z) + ly, z];
}

function Sign({ spec }: { spec: SignSpec }) {
  const texture = useMemo(
    () =>
      createSignTexture(spec.width, spec.height, {
        lines: spec.lines,
        background: spec.background,
        color: spec.color,
        border: spec.color,
      }),
    [spec],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh
      position={worldPoint(spec.anchor, spec.local)}
      rotation-y={spec.anchor.rot + (spec.turn ?? 0)}
    >
      <planeGeometry args={[spec.width, spec.height]} />
      {/* A little self-light keeps the paint readable when the board faces away from the sun. */}
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive="#ffffff"
        emissiveIntensity={0.35}
        roughness={0.7}
      />
    </mesh>
  );
}

/** Post for the free-standing direction sign by the gate. */
function SignPost() {
  const ground = heightAt(SIGNPOST.x, SIGNPOST.z);
  return (
    <mesh position={[SIGNPOST.x, ground + 1.2, SIGNPOST.z]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
      <meshStandardMaterial color={PALETTE.iron} />
    </mesh>
  );
}

/** A triangular pennant: wide at the pole, pointed at the tip. */
function pennantGeometry(): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([0, 0.35, 0, 0, -0.35, 0, 1.3, 0, 0]), 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

/** The saffron flag on top of the temple spire, swaying in the evening breeze. */
function TempleFlag() {
  const flag = useRef<Mesh>(null);
  const geometry = useMemo(() => pennantGeometry(), []);
  const top = worldPoint(TEMPLE, TEMPLE_SPIRE_TOP);

  useFrame(({ clock }) => {
    if (!flag.current) return;
    const t = clock.elapsedTime;
    flag.current.rotation.y = -0.6 + Math.sin(t * 0.7) * 0.35;
    flag.current.scale.x = 0.92 + Math.sin(t * 3.1) * 0.08;
  });

  return (
    <group position={top}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
        <meshStandardMaterial color={PALETTE.darkWood} />
      </mesh>
      <mesh ref={flag} geometry={geometry} position={[0, 1.3, 0]}>
        <meshStandardMaterial color={PALETTE.saffron} side={DoubleSide} />
      </mesh>
    </group>
  );
}

/** Painted signs around the village, and the temple flag. */
export function Signs() {
  return (
    <>
      {SIGNS.map((spec) => (
        <Sign key={spec.lines.join("|")} spec={spec} />
      ))}
      <SignPost />
      <TempleFlag />
    </>
  );
}
