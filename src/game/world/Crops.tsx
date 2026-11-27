"use client";

import { useEffect, useMemo } from "react";
import { Color, type BufferGeometry } from "three";
import { mulberry32 } from "@/utils/math";
import { GeometryBatch } from "./batch";
import { boundsOf, inPolygon } from "./data/geometry";
import { FIELDS, type Field } from "./data/layout";
import { DetailCells } from "./DetailCells";
import { createDetailGroup, type InstanceSpec } from "./instancing";
import { heightAt, roadEdgeDistance } from "./terrain";
import { WORLD_MATERIALS } from "./worldMaterials";

type Crop = "mustard" | "wheat" | "paddy";

/** Row and plant spacing in metres. */
const SPACING = { across: 1.3, along: 0.9 };

/** Cell size (m), and the distances (m) where plants simplify and then vanish into the haze. */
const CELL_SIZE = 50;
const DETAIL_DISTANCE = 45;
const DRAW_DISTANCE = 150;

const CROP_SHAPES: Record<Crop, (b: GeometryBatch) => void> = {
  // Green stems topped with a cloud of yellow flowers.
  mustard: (b) => {
    for (let i = 0; i < 2; i++) {
      const angle = i * Math.PI;
      const x = Math.cos(angle) * 0.12;
      const z = Math.sin(angle) * 0.12;
      b.cylinder(0.015, 0.02, 0.8, [x, 0.4, z], "#6e8d36", 3);
      b.blob(0.16, [x, 0.85, z], "#f1cf32", [1, 0.7, 1], 0);
    }
  },
  // Golden stalks, splayed slightly outward.
  wheat: (b) => {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const lean: [number, number, number] = [Math.sin(angle) * 0.15, 0, -Math.cos(angle) * 0.15];
      b.cone(0.04, 0.95, [Math.cos(angle) * 0.1, 0.47, Math.sin(angle) * 0.1], "#d6b052", 3, lean);
    }
  },
  // Bright young rice shoots.
  paddy: (b) => {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const lean: [number, number, number] = [Math.sin(angle) * 0.35, 0, -Math.cos(angle) * 0.35];
      b.cone(
        0.03,
        0.55,
        [Math.cos(angle) * 0.08, 0.27, Math.sin(angle) * 0.08],
        "#7fb640",
        3,
        lean,
      );
    }
  },
};

/** Far off, a whole plant is one small lump of its colour. */
const FAR_CROP_SHAPES: Record<Crop, (b: GeometryBatch) => void> = {
  mustard: (b) => b.blob(0.22, [0, 0.8, 0], "#e3c234", [1.2, 0.8, 1.2], 0),
  wheat: (b) => b.cone(0.2, 0.95, [0, 0.47, 0], "#d6b052", 3),
  paddy: (b) => b.cone(0.18, 0.55, [0, 0.27, 0], "#7fb640", 3),
};

function shape(build: (b: GeometryBatch) => void): BufferGeometry {
  const batch = new GeometryBatch();
  build(batch);
  return batch.build()!;
}

/** Plants in neat rows inside the field's outline, skipping any spot on a path. */
function plantField(field: Field, seed: number): InstanceSpec[] {
  const random = mulberry32(seed);
  const plants: InstanceSpec[] = [];
  const { minX, maxX, minZ, maxZ } = boundsOf(field.polygon);
  for (let x = minX + 0.6; x < maxX - 0.4; x += SPACING.across) {
    for (let z = minZ + 0.5; z < maxZ - 0.4; z += SPACING.along) {
      const px = x + (random() - 0.5) * 0.25;
      const pz = z + (random() - 0.5) * 0.25;
      // Keep a small margin inside the wall.
      if (!inPolygon(px, pz, field.polygon) || !inPolygon(px + 0.8, pz + 0.8, field.polygon))
        continue;
      if (!inPolygon(px - 0.8, pz - 0.8, field.polygon) || roadEdgeDistance(px, pz) < 0.4) continue;
      const y = heightAt(px, pz);
      plants.push({
        x: px,
        y,
        z: pz,
        rotationY: random() * Math.PI * 2,
        scale: 0.85 + random() * 0.3,
        tint: new Color(1, 1, 1).offsetHSL(0, 0, (random() - 0.5) * 0.12),
      });
    }
  }
  return plants;
}

/** Every crop in every field, drawn by distance (see DetailCells). */
export function Crops() {
  const { groups, geometries } = useMemo(() => {
    const crops: Crop[] = ["mustard", "wheat", "paddy"];
    const geometries: BufferGeometry[] = [];
    const groups = crops.map((crop, cropIndex) => {
      const fields = FIELDS.filter((f) => f.use === crop);
      const plants = fields.flatMap((field, i) => plantField(field, cropIndex * 100 + i));
      const near = shape(CROP_SHAPES[crop]);
      const far = shape(FAR_CROP_SHAPES[crop]);
      geometries.push(near, far);
      return createDetailGroup(
        {
          name: `crop:${crop}`,
          near,
          far,
          material: WORLD_MATERIALS.instanced,
          castShadow: false,
          farFrom: DETAIL_DISTANCE,
          hideFrom: DRAW_DISTANCE,
        },
        plants,
        CELL_SIZE,
      );
    });
    return { groups, geometries };
  }, []);

  useEffect(
    () => () => {
      for (const geometry of geometries) geometry.dispose();
    },
    [geometries],
  );

  return <DetailCells groups={groups} />;
}
