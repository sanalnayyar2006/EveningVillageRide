"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  PointsMaterial,
} from "three";
import { boundsOf } from "@/game/world/data/geometry";
import { FIELDS, POND } from "@/game/world/data/layout";
import { heightAt } from "@/game/world/terrain";
import { mulberry32, smoothstep } from "@/utils/math";
import { ambient } from "./ambientState";

const COUNT = 140;

/** Where fireflies gather: round the pond and along the orchards. [x, z, radius] */
const SWARMS: [number, number, number][] = [
  [POND.x, POND.z, POND.radius + 7],
  ...FIELDS.filter((f) => f.use === "orchard").map((f): [number, number, number] => {
    const b = boundsOf(f.polygon);
    return [
      (b.minX + b.maxX) / 2,
      (b.minZ + b.maxZ) / 2,
      Math.min(b.maxX - b.minX, b.maxZ - b.minZ) / 2,
    ];
  }),
];

/** A soft round dot, so each firefly is a glow rather than a square. */
function glowSprite(): CanvasTexture {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/** Glowing specks that drift and blink once dusk falls. */
export function Fireflies() {
  const { geometry, material, homes } = useMemo(() => {
    const random = mulberry32(99);
    const homes = Array.from({ length: COUNT }, () => {
      const [cx, cz, r] = SWARMS[Math.floor(random() * SWARMS.length)]!;
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * r;
      const x = cx + Math.cos(angle) * distance;
      const z = cz + Math.sin(angle) * distance;
      return { x, y: heightAt(x, z) + 0.4 + random() * 1.6, z, seed: random() * 50 };
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    geometry.setAttribute("color", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    const material = new PointsMaterial({
      size: 0.35,
      map: glowSprite(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    return { geometry, material, homes };
  }, []);

  useFrame(() => {
    const t = ambient.time;
    const dusk = smoothstep(0.55, 0.85, ambient.dayProgress);
    material.visible = dusk > 0;
    if (!material.visible) return;
    const positions = geometry.getAttribute("position") as BufferAttribute;
    const colors = geometry.getAttribute("color") as BufferAttribute;
    homes.forEach((f, i) => {
      positions.setXYZ(
        i,
        f.x + Math.sin(t * 0.3 + f.seed) * 1.2,
        f.y + Math.sin(t * 0.5 + f.seed * 2) * 0.4,
        f.z + Math.cos(t * 0.27 + f.seed) * 1.2,
      );
      // Each one blinks on its own slow rhythm.
      const glow = dusk * Math.max(0, Math.sin(t * 1.3 + f.seed)) ** 3;
      colors.setXYZ(i, glow, glow * 0.95, glow * 0.4);
    });
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
