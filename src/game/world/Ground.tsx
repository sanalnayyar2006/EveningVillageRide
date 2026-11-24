"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { mulberry32 } from "@/utils/math";

const SIZE = 1200;
/** Metres covered by one texture tile. */
const TILE = 8;

/** Grass-like tile with a faint seam, so speed and turning read clearly on flat ground. */
function createGroundTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.fillStyle = "#93a04f";
  ctx.fillRect(0, 0, size, size);
  const rand = mulberry32(11);
  for (let i = 0; i < 900; i++) {
    const shade = rand() < 0.5 ? "rgba(70,90,30,0.1)" : "rgba(200,190,110,0.1)";
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 1 + rand() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(60,70,25,0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(SIZE / TILE, SIZE / TILE);
  texture.anisotropy = 8;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Flat placeholder ground. Phase 2 replaces it with the village terrain. */
export function Ground() {
  const texture = useMemo(() => createGroundTexture(), []);
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[SIZE / 2, 0.5, SIZE / 2]} position={[0, -0.5, 0]} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial map={texture} roughness={0.95} />
      </mesh>
    </RigidBody>
  );
}
