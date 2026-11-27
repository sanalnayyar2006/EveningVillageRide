"use client";

import { useEffect, useMemo } from "react";
import { Color, type BufferGeometry } from "three";
import { GeometryBatch } from "./batch";
import { FLOWERS, GRASS_TUFTS, TREES, type TreeKind } from "./data/vegetation";
import { DetailCells } from "./DetailCells";
import { createDetailGroup, type DetailedShape, type InstanceSpec } from "./instancing";
import { heightAt } from "./terrain";
import { PALETTE, WORLD_MATERIALS } from "./worldMaterials";

// Tree shapes at scale 1, built once and instanced everywhere they're needed.
// Each has a far version with a few big facets, drawn once a tree is far off.

function roundTree(b: GeometryBatch, far: boolean) {
  if (far) {
    b.cylinder(0.2, 0.28, 2.8, [0, 1.4, 0], PALETTE.bark, 4);
    b.blob(2.2, [0, 3.9, 0], PALETTE.leaf, [1.1, 0.85, 1.1], 0);
    b.blob(1.3, [0.9, 3.5, 0.2], PALETTE.darkLeaf, undefined, 0);
    return;
  }
  b.cylinder(0.18, 0.28, 2.8, [0, 1.4, 0], PALETTE.bark, 7);
  b.blob(1.9, [0, 3.8, 0], PALETTE.leaf, [1, 0.8, 1]);
  b.blob(1.3, [1.1, 3.4, 0.3], PALETTE.darkLeaf);
  b.blob(1.2, [-0.9, 3.5, -0.6], "#6a8a3a");
  b.blob(1.1, [0.2, 4.6, -0.4], "#6f8f3d");
}

function tallTree(b: GeometryBatch, far: boolean) {
  b.cylinder(0.12, 0.2, 4.8, [0, 2.4, 0], "#7a6650", far ? 4 : 6);
  b.blob(1.2, [0, 4.8, 0], PALETTE.darkLeaf, [1, 1.6, 1], far ? 0 : 1);
  if (!far) b.blob(0.9, [0.2, 6.4, 0.1], PALETTE.leaf, [1, 1.3, 1]);
}

const TREE_BUILDERS: Record<TreeKind, (b: GeometryBatch, far: boolean) => void> = {
  round: roundTree,
  tall: tallTree,
};

function buildShape(build: (b: GeometryBatch) => void): BufferGeometry {
  const batch = new GeometryBatch();
  build(batch);
  const geometry = batch.build();
  if (!geometry) throw new Error("Empty vegetation shape");
  return geometry;
}

/** Cell size (m) for splitting vegetation up so off-screen patches are skipped. */
const CELL_SIZE = 60;
/** Beyond this (m) trees switch to their far version. */
const TREE_DETAIL_DISTANCE = 80;
/** Beyond this (m) grass tufts and flowers are too small to see (and the haze hides them). */
const UNDERGROWTH_DISTANCE = 70;

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

/** Every tree, grass tuft and flower in the village, drawn by distance (see DetailCells). */
export function Vegetation() {
  const { groups, geometries } = useMemo(() => {
    const geometries: BufferGeometry[] = [];
    const keep = (geometry: BufferGeometry) => (geometries.push(geometry), geometry);

    const trees = (Object.keys(TREE_BUILDERS) as TreeKind[]).map((kind) => {
      const specs: InstanceSpec[] = TREES.filter((t) => t.kind === kind).map((t) => ({
        x: t.x,
        y: heightAt(t.x, t.z),
        z: t.z,
        rotationY: t.rot,
        scale: t.scale,
        tint: varied(t.tint, 0.06, 0.18),
      }));
      const shape: DetailedShape = {
        name: `tree:${kind}`,
        near: keep(buildShape((b) => TREE_BUILDERS[kind](b, false))),
        far: keep(buildShape((b) => TREE_BUILDERS[kind](b, true))),
        material: WORLD_MATERIALS.instanced,
        castShadow: true,
        farFrom: TREE_DETAIL_DISTANCE,
        hideFrom: Infinity,
      };
      return createDetailGroup(shape, specs, CELL_SIZE);
    });

    const undergrowth = (name: string, geometry: BufferGeometry): DetailedShape => ({
      name,
      near: keep(geometry),
      far: null,
      material: WORLD_MATERIALS.instanced,
      castShadow: false,
      farFrom: UNDERGROWTH_DISTANCE,
      hideFrom: UNDERGROWTH_DISTANCE,
    });

    const grassColour = new Color("#8e9a45");
    const dryColour = new Color("#b9a85c");
    const grass = createDetailGroup(
      undergrowth("grass", buildShape(grassTuft)),
      GRASS_TUFTS.map((g, i) => ({
        x: g.x,
        y: heightAt(g.x, g.z),
        z: g.z,
        rotationY: g.rot,
        scale: g.scale,
        tint: grassColour.clone().lerp(dryColour, (i * 0.618) % 1),
      })),
      CELL_SIZE,
    );

    const flowers = createDetailGroup(
      undergrowth("flowers", buildShape(flower)),
      FLOWERS.map((f) => ({
        x: f.x,
        y: heightAt(f.x, f.z),
        z: f.z,
        rotationY: f.rot,
        scale: f.scale,
        tint: FLOWER_COLOURS[f.color] ?? FLOWER_COLOURS[0]!,
      })),
      CELL_SIZE,
    );

    return { groups: [...trees, grass, flowers], geometries };
  }, []);

  useEffect(
    () => () => {
      for (const geometry of geometries) geometry.dispose();
    },
    [geometries],
  );

  return <DetailCells groups={groups} />;
}
