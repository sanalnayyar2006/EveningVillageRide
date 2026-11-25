"use client";

import { useMemo } from "react";
import { BufferAttribute, BufferGeometry, LineBasicMaterial } from "three";
import { POLE_HEIGHT, POWER_POLES, WIRE_OFFSETS } from "./data/props";
import { heightAt } from "./terrain";

/** Points per span; enough for the sag to read as a curve. */
const SPAN_POINTS = 10;
const SAG = 0.7;

/** Wires drooping between neighbouring power poles, drawn as thin lines. */
export function PowerLines() {
  const { geometry, material } = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < POWER_POLES.length - 1; i++) {
      const [ax, az] = POWER_POLES[i]!;
      const [bx, bz] = POWER_POLES[i + 1]!;
      // Only join poles that stand next to each other (not across the gap at the bridge).
      if (Math.abs(az - bz) > 40) continue;
      const ay = heightAt(ax, az) + POLE_HEIGHT - 0.15;
      const by = heightAt(bx, bz) + POLE_HEIGHT - 0.15;
      for (const offset of WIRE_OFFSETS) {
        for (let p = 0; p < SPAN_POINTS; p++) {
          for (const t of [p / SPAN_POINTS, (p + 1) / SPAN_POINTS]) {
            const sag = 4 * SAG * t * (1 - t);
            positions.push(
              ax + offset + (bx - ax) * t,
              ay + (by - ay) * t - sag,
              az + (bz - az) * t,
            );
          }
        }
      }
    }
    const lines = new BufferGeometry();
    lines.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
    return { geometry: lines, material: new LineBasicMaterial({ color: "#2b2622" }) };
  }, []);

  return <lineSegments geometry={geometry} material={material} />;
}
