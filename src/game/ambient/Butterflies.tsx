"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, Matrix4 } from "three";
import { joint, PartSet, root } from "@/game/life/rig";
import { GeometryBatch } from "@/game/world/batch";
import { FLOWER_PATCHES } from "@/game/world/data/vegetation";
import { heightAt } from "@/game/world/terrain";
import { mulberry32, smoothstep } from "@/utils/math";
import { ambient } from "./ambientState";

const PER_PATCH = 4;
const COLOURS = ["#f2c230", "#f08a24", "#f6f1e4", "#e8789a"].map((c) => new Color(c));

interface Butterfly {
  patch: [number, number];
  seed: number;
  colour: Color;
}

function wingShape() {
  const batch = new GeometryBatch();
  batch.box([0.07, 0.004, 0.06], [0.035, 0, 0.01], "#ffffff");
  batch.box([0.05, 0.004, 0.04], [0.03, 0, -0.035], "#ffffff");
  return batch.build()!;
}

const base = new Matrix4();
const wing = new Matrix4();

/** Butterflies flitting about the flower patches until the light goes. */
export function Butterflies() {
  const butterflies = useMemo(() => {
    const random = mulberry32(8);
    return FLOWER_PATCHES.flatMap((patch) =>
      Array.from({ length: PER_PATCH }, (): Butterfly => ({
        patch,
        seed: random() * 100,
        colour: COLOURS[Math.floor(random() * COLOURS.length)]!,
      })),
    );
  }, []);
  const parts = useMemo(
    () => new PartSet({ wing: { capacity: butterflies.length * 2, geometry: wingShape() } }, false),
    [butterflies],
  );
  useEffect(() => () => parts.dispose(), [parts]);

  useFrame(() => {
    const t = ambient.time;
    // They settle for the night as dusk comes on.
    const awake = 1 - smoothstep(0.6, 0.8, ambient.dayProgress);
    parts.begin();
    if (awake > 0) {
      for (const b of butterflies) {
        // A wandering Lissajous path around the patch.
        const s = b.seed;
        const x = b.patch[0] + Math.sin(t * 0.37 + s) * 2.6 + Math.sin(t * 1.1 + s * 2) * 0.6;
        const z = b.patch[1] + Math.cos(t * 0.29 + s * 1.3) * 2.6 + Math.cos(t * 0.9 + s) * 0.6;
        const y = heightAt(x, z) + (0.5 + Math.abs(Math.sin(t * 0.8 + s)) * 0.9) * awake;
        const heading = t * 0.4 + s;
        const flap = Math.sin(t * 24 + s) * 1.1;
        root(base, x, y, z, heading);
        joint(wing, base, 0, 0, 0, 0, 0, flap);
        parts.place("wing", wing, b.colour);
        joint(wing, base, 0, 0, 0, 0, Math.PI, flap);
        parts.place("wing", wing, b.colour);
      }
    }
    parts.end();
  });

  return (
    <>
      {parts.meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </>
  );
}
