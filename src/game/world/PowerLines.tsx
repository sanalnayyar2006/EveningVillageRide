"use client";

import { useMemo } from "react";
import { BufferAttribute, BufferGeometry, LineBasicMaterial } from "three";
import { POWER_POLES, WIRE_OFFSETS, wirePoint } from "./data/props";

/** Points per span; enough for the sag to read as a curve. */
const SPAN_POINTS = 10;

/** Wires drooping between neighbouring power poles, drawn as thin lines. */
export function PowerLines() {
  const { geometry, material } = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < POWER_POLES.length - 1; i++) {
      const a = POWER_POLES[i]!;
      const b = POWER_POLES[i + 1]!;
      // Only join neighbouring poles, not across a gap where one was left out.
      if (Math.hypot(b.x - a.x, b.z - a.z) > 40) continue;
      for (const offset of WIRE_OFFSETS) {
        for (let p = 0; p < SPAN_POINTS; p++) {
          positions.push(...wirePoint(a, b, offset, p / SPAN_POINTS));
          positions.push(...wirePoint(a, b, offset, (p + 1) / SPAN_POINTS));
        }
      }
    }
    const lines = new BufferGeometry();
    lines.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
    return { geometry: lines, material: new LineBasicMaterial({ color: "#2b2622" }) };
  }, []);

  return <lineSegments geometry={geometry} material={material} />;
}
