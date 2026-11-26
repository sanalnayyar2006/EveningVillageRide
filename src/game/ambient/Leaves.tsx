"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, Matrix4 } from "three";
import { joint, PartSet, root } from "@/game/life/rig";
import { GeometryBatch } from "@/game/world/batch";
import { heightAt } from "@/game/world/terrain";
import { useBikeStore } from "@/store/bikeStore";
import { mulberry32 } from "@/utils/math";
import { MAX_DT } from "@/game/core/frameOrder";
import { ambient } from "./ambientState";

const COUNT = 70;
/** Leaves tumble through a box this far around the rider. */
const RANGE = 22;
/** Gusts blow from the west-north-west, the same side as the low sun. */
const WIND_DIRECTION: [number, number] = [0.85, 0.53];
const COLOURS = ["#c98b2b", "#a8662a", "#7f8f3d", "#d9a73a"].map((c) => new Color(c));

interface Leaf {
  x: number;
  z: number;
  lift: number;
  spin: number;
  seed: number;
  colour: Color;
}

/** Dry leaves that whirl past the rider during a gust of wind. */
export function Leaves() {
  const leaves = useMemo(() => {
    const random = mulberry32(64);
    return Array.from({ length: COUNT }, (): Leaf => ({
      x: (random() * 2 - 1) * RANGE,
      z: (random() * 2 - 1) * RANGE,
      lift: random() * 3,
      spin: random() * 6,
      seed: random() * 10,
      colour: COLOURS[Math.floor(random() * COLOURS.length)]!,
    }));
  }, []);
  const parts = useMemo(() => {
    const batch = new GeometryBatch();
    batch.box([0.09, 0.005, 0.06], [0, 0, 0], "#ffffff");
    return new PartSet({ leaf: { capacity: COUNT, geometry: batch.build()! } }, false);
  }, []);
  useEffect(() => () => parts.dispose(), [parts]);

  const base = useMemo(() => new Matrix4(), []);
  const leafM = useMemo(() => new Matrix4(), []);

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const gust = ambient.gust;
    parts.begin();
    if (gust > 0.05) {
      const bike = useBikeStore.getState().telemetry;
      const speed = 4 + gust * 6;
      const shown = Math.floor(COUNT * Math.min(1, gust * 1.4));
      for (let i = 0; i < shown; i++) {
        const leaf = leaves[i]!;
        // Leaves live in a box that travels with the rider, wrapping round as they blow through.
        leaf.x += WIND_DIRECTION[0] * speed * dt;
        leaf.z += WIND_DIRECTION[1] * speed * dt;
        if (leaf.x > RANGE) leaf.x -= RANGE * 2;
        if (leaf.z > RANGE) leaf.z -= RANGE * 2;
        leaf.spin += dt * (3 + leaf.seed * 0.3);
        const x = bike.x + leaf.x;
        const z = bike.z + leaf.z;
        const y = heightAt(x, z) + 0.3 + leaf.lift + Math.sin(ambient.time * 2 + leaf.seed) * 0.6;
        root(base, x, y, z, leaf.spin);
        joint(leafM, base, 0, 0, 0, leaf.spin * 1.3, 0, leaf.spin * 0.7);
        parts.place("leaf", leafM, leaf.colour);
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
