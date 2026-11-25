"use client";

import { useEffect, useMemo } from "react";
import { Color, type BufferGeometry } from "three";
import { mulberry32 } from "@/utils/math";
import { GeometryBatch } from "./batch";
import { FIELDS, type FieldPatch } from "./data/layout";
import { createInstances, type InstanceSpec } from "./instancing";
import { heightAt, roadEdgeDistance } from "./terrain";
import { WORLD_MATERIALS } from "./worldMaterials";

type Crop = FieldPatch["crop"];

/** Row and plant spacing in metres. */
const SPACING = { across: 1.3, along: 0.9 };

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

function shape(crop: Crop): BufferGeometry {
  const batch = new GeometryBatch();
  CROP_SHAPES[crop](batch);
  return batch.build()!;
}

/** Plants in neat rows, skipping any spot that's under water or on a path. */
function plantField(field: FieldPatch, seed: number): InstanceSpec[] {
  const random = mulberry32(seed);
  const plants: InstanceSpec[] = [];
  for (let x = field.min[0] + 0.6; x < field.max[0] - 0.4; x += SPACING.across) {
    for (let z = field.min[1] + 0.5; z < field.max[1] - 0.4; z += SPACING.along) {
      const px = x + (random() - 0.5) * 0.25;
      const pz = z + (random() - 0.5) * 0.25;
      const y = heightAt(px, pz);
      if (y < -0.05 || roadEdgeDistance(px, pz) < 0.4) continue;
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

/** Every crop in every field, one instanced draw call per crop type. */
export function Crops() {
  const meshes = useMemo(() => {
    const crops: Crop[] = ["mustard", "wheat", "paddy"];
    return crops.map((crop, cropIndex) => {
      const fields = FIELDS.filter((f) => f.crop === crop);
      const plants = fields.flatMap((field, i) => plantField(field, cropIndex * 100 + i));
      return createInstances(shape(crop), WORLD_MATERIALS.instanced, plants, false);
    });
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
