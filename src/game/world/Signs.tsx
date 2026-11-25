"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide, type Mesh } from "three";
import { createSignTexture } from "./canvasText";
import { BUS_STOP_SIGN } from "./landmarks/busStop";
import { GATE_SIGN } from "./landmarks/gate";
import { SCHOOL_SIGN } from "./landmarks/school";
import { TEA_STALL_SIGN } from "./landmarks/teaStall";
import { TEMPLE_SPIRE_TOP } from "./landmarks/temple";
import { heightAt } from "./terrain";
import { PALETTE } from "./worldMaterials";

interface SignSpec {
  position: [number, number, number];
  /** Radians; 0 faces +Z (south), -π/2 faces -X (west). */
  rotationY: number;
  width: number;
  height: number;
  lines: string[];
  background: string;
  color: string;
}

const FACE_SOUTH = 0;
const FACE_NORTH = Math.PI;
const FACE_WEST = -Math.PI / 2;

const SIGNS: SignSpec[] = [
  {
    position: [0, GATE_SIGN.y, GATE_SIGN.z + 0.31],
    rotationY: FACE_SOUTH,
    width: GATE_SIGN.width,
    height: GATE_SIGN.height,
    lines: ["स्वागत है  ·  WELCOME"],
    background: "#9c2a17",
    color: "#ffe08a",
  },
  {
    position: [0, GATE_SIGN.y, GATE_SIGN.z - 0.31],
    rotationY: FACE_NORTH,
    width: GATE_SIGN.width,
    height: GATE_SIGN.height,
    lines: ["फिर आइएगा  ·  COME AGAIN"],
    background: "#9c2a17",
    color: "#ffe08a",
  },
  {
    position: [BUS_STOP_SIGN.x - 0.05, BUS_STOP_SIGN.y, BUS_STOP_SIGN.z],
    rotationY: FACE_WEST,
    width: 0.7,
    height: 0.45,
    lines: ["बस स्टॉप", "BUS STOP"],
    background: "#1f5f8b",
    color: "#ffffff",
  },
  {
    position: [TEA_STALL_SIGN.x, TEA_STALL_SIGN.y, TEA_STALL_SIGN.z],
    rotationY: FACE_WEST,
    width: 2.8,
    height: 0.55,
    lines: ["चाय  ·  Ramu Tea Stall"],
    background: "#f2c230",
    color: "#5a1d0e",
  },
  {
    position: [SCHOOL_SIGN.x, SCHOOL_SIGN.y, SCHOOL_SIGN.z],
    rotationY: FACE_NORTH,
    width: 7,
    height: 0.85,
    lines: ["राजकीय प्राथमिक विद्यालय", "Government Primary School"],
    background: "#f7f1e3",
    color: "#1f3b8c",
  },
  {
    position: [4, 2.2, 3.9],
    rotationY: FACE_SOUTH,
    width: 1.6,
    height: 0.6,
    lines: ["← मंदिर  Temple", "Market  बाज़ार →"],
    background: "#2f6b3a",
    color: "#ffffff",
  },
];

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
    <mesh position={spec.position} rotation-y={spec.rotationY}>
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

/** Post for the free-standing direction sign at the crossroads. */
function SignPost() {
  const ground = heightAt(4, 3.9);
  return (
    <mesh position={[4, ground + 1.2, 3.85]} castShadow>
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
  const { x, y, z } = TEMPLE_SPIRE_TOP;
  const ground = heightAt(x, z);

  useFrame(({ clock }) => {
    if (!flag.current) return;
    const t = clock.elapsedTime;
    flag.current.rotation.y = -0.6 + Math.sin(t * 0.7) * 0.35;
    flag.current.scale.x = 0.92 + Math.sin(t * 3.1) * 0.08;
  });

  return (
    <group position={[x, ground + y, z]}>
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
