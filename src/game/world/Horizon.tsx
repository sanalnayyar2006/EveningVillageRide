"use client";

import { useMemo } from "react";
import { CylinderGeometry, DoubleSide, MeshBasicMaterial } from "three";

/** Two rings of hazy hills far beyond the map, so the world never seems to end. */
const RINGS = [
  { radius: 520, minHeight: 30, maxHeight: 70, color: "#9c7a72", seed: 1 },
  { radius: 780, minHeight: 60, maxHeight: 130, color: "#c49a88", seed: 7 },
] as const;

function buildRing(radius: number, minHeight: number, maxHeight: number, seed: number) {
  const ring = new CylinderGeometry(radius, radius, 1, 120, 1, true);
  const positions = ring.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    if (positions.getY(i) < 0) {
      positions.setY(i, -10);
      continue;
    }
    const angle = Math.atan2(positions.getZ(i), positions.getX(i));
    const ridge = 0.5 + 0.3 * Math.sin(angle * 5 + seed) + 0.2 * Math.sin(angle * 13 + seed * 2.3);
    positions.setY(i, minHeight + (maxHeight - minHeight) * ridge);
  }
  ring.computeVertexNormals();
  return ring;
}

export function Horizon() {
  const rings = useMemo(
    () =>
      RINGS.map((r) => ({
        geometry: buildRing(r.radius, r.minHeight, r.maxHeight, r.seed),
        // Unlit and unfogged: a flat silhouette in a fixed haze colour.
        material: new MeshBasicMaterial({ color: r.color, fog: false, side: DoubleSide }),
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
