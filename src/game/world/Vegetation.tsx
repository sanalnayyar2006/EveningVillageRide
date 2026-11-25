"use client";

import { useEffect, useMemo } from "react";
import { Color, type BufferGeometry } from "three";
import { GeometryBatch } from "./batch";
import { FLOWERS, GRASS_TUFTS, TREES, type TreeKind } from "./data/vegetation";
import { createInstances, type InstanceSpec } from "./instancing";
import { heightAt } from "./terrain";
import { PALETTE, WORLD_MATERIALS } from "./worldMaterials";

// Tree shapes at scale 1, built once and instanced everywhere they're needed.

function roundTree(b: GeometryBatch) {
  b.cylinder(0.18, 0.28, 2.8, [0, 1.4, 0], PALETTE.bark, 7);
  b.blob(1.9, [0, 3.8, 0], PALETTE.leaf, [1, 0.8, 1]);
  b.blob(1.3, [1.1, 3.4, 0.3], PALETTE.darkLeaf);
  b.blob(1.2, [-0.9, 3.5, -0.6], "#6a8a3a");
  b.blob(1.1, [0.2, 4.6, -0.4], "#6f8f3d");
}

function tallTree(b: GeometryBatch) {
  b.cylinder(0.12, 0.2, 4.8, [0, 2.4, 0], "#7a6650", 6);
  b.blob(1.2, [0, 4.8, 0], PALETTE.darkLeaf, [1, 1.6, 1]);
  b.blob(0.9, [0.2, 6.4, 0.1], PALETTE.leaf, [1, 1.3, 1]);
}

function palmTree(b: GeometryBatch) {
  // A trunk that leans further with height.
  const segments = 6;
  let x = 0;
  let y = 0;
  for (let i = 0; i < segments; i++) {
    const lean = 0.06 + i * 0.035;
    const height = 1.1;
    const radius = 0.2 - i * 0.012;
    b.cylinder(
      radius - 0.01,
      radius,
      height,
      [x + Math.sin(lean) * height * 0.5, y + height / 2, 0],
      "#8a7358",
      7,
      [0, 0, -lean],
    );
    x += Math.sin(lean) * height;
    y += Math.cos(lean) * height;
  }
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    b.group([x, y, 0], angle, () => {
      b.box([0.32, 0.04, 2.6], [0, -0.35, 1.2], i % 2 ? "#5f8a33" : "#4f7a2b", [0.45, 0, 0]);
    });
  }
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    b.sphere(0.13, [x + Math.cos(angle) * 0.22, y - 0.2, Math.sin(angle) * 0.22], "#6b4a2a");
  }
}

const TREE_BUILDERS: Record<TreeKind, (b: GeometryBatch) => void> = {
  round: roundTree,
  tall: tallTree,
  palm: palmTree,
};

function buildShape(build: (b: GeometryBatch) => void): BufferGeometry {
  const batch = new GeometryBatch();
  build(batch);
  const geometry = batch.build();
  if (!geometry) throw new Error("Empty vegetation shape");
  return geometry;
}

function grassTuft(b: GeometryBatch) {
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    b.cone(0.05, 0.5, [Math.cos(angle) * 0.06, 0.25, Math.sin(angle) * 0.06], "#ffffff", 3, [
      Math.sin(angle) * 0.3,
      0,
      -Math.cos(angle) * 0.3,
    ]);
  }
}

function flower(b: GeometryBatch) {
  for (const [x, z, height] of [
    [0, 0, 0.32],
    [0.07, 0.04, 0.26],
    [-0.05, 0.06, 0.22],
  ] as const) {
    b.cylinder(0.01, 0.01, height, [x, height / 2, z], "#5c7a34", 3);
    b.blob(0.045, [x, height + 0.02, z], "#ffffff", undefined, 0);
  }
}

const FLOWER_COLOURS = ["#f08a24", "#f2c230", "#e8789a", "#f6f1e4"].map((c) => new Color(c));

/** Subtle per-instance colour variation so repeated shapes don't look stamped. */
function varied(random: number, hueShift = 0.04, lightness = 0.12): Color {
  return new Color(1, 1, 1).offsetHSL((random - 0.5) * hueShift, 0, (random - 0.5) * lightness);
}

/** Every tree, grass tuft and flower in the village: five instanced draw calls in total. */
export function Vegetation() {
  const meshes = useMemo(() => {
    const trees = (Object.keys(TREE_BUILDERS) as TreeKind[]).map((kind) => {
      const specs: InstanceSpec[] = TREES.filter((t) => t.kind === kind).map((t) => ({
        x: t.x,
        y: heightAt(t.x, t.z),
        z: t.z,
        rotationY: t.rot,
        scale: t.scale,
        tint: varied(t.tint, 0.06, 0.18),
      }));
      return createInstances(
        buildShape(TREE_BUILDERS[kind]),
        WORLD_MATERIALS.instanced,
        specs,
        true,
      );
    });

    const grassColour = new Color("#8e9a45");
    const dryColour = new Color("#b9a85c");
    const grass = createInstances(
      buildShape(grassTuft),
      WORLD_MATERIALS.instanced,
      GRASS_TUFTS.map((g, i) => ({
        x: g.x,
        y: heightAt(g.x, g.z),
        z: g.z,
        rotationY: g.rot,
        scale: g.scale,
        tint: grassColour.clone().lerp(dryColour, (i * 0.618) % 1),
      })),
      false,
    );

    const flowers = createInstances(
      buildShape(flower),
      WORLD_MATERIALS.instanced,
      FLOWERS.map((f) => ({
        x: f.x,
        y: heightAt(f.x, f.z),
        z: f.z,
        rotationY: f.rot,
        scale: f.scale,
        tint: FLOWER_COLOURS[f.color] ?? FLOWER_COLOURS[0]!,
      })),
      false,
    );

    return [...trees, grass, flowers];
  }, []);

  useEffect(() => () => meshes.forEach((mesh) => mesh.dispose()), [meshes]);

  return (
    <>
      {meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </>
  );
}
