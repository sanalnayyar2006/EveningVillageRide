"use client";

import { useMemo } from "react";
import { BufferAttribute, Color, CylinderGeometry, DoubleSide, MeshBasicMaterial } from "three";
import { smoothstep } from "@/utils/math";

/**
 * Two rings of hazy hills far beyond the map. To the north the outer ring
 * rises into the snow-capped Dhauladhar range that stands behind Kangra.
 */
const RINGS = [
  { radius: 560, minHeight: 30, maxHeight: 75, color: "#8f7a6c", seed: 1, range: 0.4 },
  { radius: 820, minHeight: 60, maxHeight: 140, color: "#b89a8c", seed: 7, range: 1.6 },
] as const;

const SNOW = new Color("#f4eee8");

function buildRing(ring: (typeof RINGS)[number]) {
  const { radius, minHeight, maxHeight, seed, range } = ring;
  const geometry = new CylinderGeometry(radius, radius, 1, 160, 1, true);
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  const base = new Color(ring.color);
  const color = new Color();

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    color.copy(base);
    if (positions.getY(i) < 0) {
      positions.setY(i, -10);
    } else {
      const angle = Math.atan2(z, x);
      const ridge =
        0.5 + 0.3 * Math.sin(angle * 5 + seed) + 0.2 * Math.sin(angle * 13 + seed * 2.3);
      // North is -Z: 1 straight north, 0 east, west and south.
      const north = Math.max(0, -z / radius) ** 2;
      const height = (minHeight + (maxHeight - minHeight) * ridge) * (1 + range * north);
      positions.setY(i, height);
      color.lerp(SNOW, north * smoothstep(maxHeight * 0.9, maxHeight * 1.6, height));
    }
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function Horizon() {
  const rings = useMemo(
    () =>
      RINGS.map((ring) => ({
        geometry: buildRing(ring),
        // Unlit and unfogged: a flat silhouette in fixed haze colours.
        material: new MeshBasicMaterial({ vertexColors: true, fog: false, side: DoubleSide }),
      })),
    [],
  );

  return (
    <>
      {rings.map((ring, i) => (
        <mesh key={i} geometry={ring.geometry} material={ring.material} renderOrder={-1} />
      ))}
    </>
  );
}
