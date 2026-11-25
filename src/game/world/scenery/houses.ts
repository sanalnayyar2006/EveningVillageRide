import { ExtrudeGeometry, Shape } from "three";
import { mulberry32 } from "@/utils/math";
import type { GeometryBatch } from "../batch";
import { HOUSES, type HouseSpec } from "../data/layout";
import { PALETTE } from "../worldMaterials";
import { onGround } from "./place";

/** Top of the raised plinth every house stands on. */
const PLINTH = 0.3;

/** A triangular prism lying along local X, for gable roofs and the wall triangles under them. */
function gable(halfDepth: number, height: number, length: number): ExtrudeGeometry {
  const shape = new Shape();
  shape.moveTo(-halfDepth, 0);
  shape.lineTo(halfDepth, 0);
  shape.lineTo(0, height);
  shape.closePath();
  const prism = new ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  prism.rotateY(Math.PI / 2);
  prism.translate(-length / 2, 0, 0);
  return prism;
}

/** A window: trim-coloured frame with dark glass, or warm light if someone's home. */
function windowAt(
  b: GeometryBatch,
  x: number,
  y: number,
  z: number,
  rotationY: number,
  trim: string,
  lit: boolean,
) {
  b.box([1.05, 1.15, 0.06], [x, y, z], trim, [0, rotationY, 0]);
  const glass = () => b.box([0.8, 0.9, 0.08], [x, y, z], PALETTE.windowDark, [0, rotationY, 0]);
  if (lit) b.glowing(glass);
  else glass();
}

function flatRoof(b: GeometryBatch, house: HouseSpec, top: number, hasTank: boolean) {
  const { w, d, wall } = house;
  b.box([w + 0.3, 0.18, d + 0.3], [0, top + 0.09, 0], PALETTE.cream);
  // Low parapet around the roof edge.
  const parapet = 0.5;
  const y = top + 0.18 + parapet / 2;
  b.box([w + 0.3, parapet, 0.15], [0, y, d / 2 + 0.08], wall);
  b.box([w + 0.3, parapet, 0.15], [0, y, -d / 2 - 0.08], wall);
  b.box([0.15, parapet, d + 0.3], [w / 2 + 0.08, y, 0], wall);
  b.box([0.15, parapet, d + 0.3], [-w / 2 - 0.08, y, 0], wall);
  // The black plastic water tank found on most village rooftops.
  if (hasTank) b.cylinder(0.55, 0.6, 0.95, [w / 4, top + 0.65, -d / 4], "#22201e", 12);
}

function tiledRoof(b: GeometryBatch, house: HouseSpec, top: number) {
  const { w, d, wall } = house;
  const rise = d * 0.32;
  b.add(gable(d / 2 - 0.02, rise * 0.92, w - 0.02), [0, top, 0], wall);
  b.add(gable(d / 2 + 0.45, rise + 0.2, w + 0.6), [0, top - 0.12, 0], PALETTE.terracotta);
}

/** A charpai: the woven string cot that sits outside village homes. */
function charpai(b: GeometryBatch, x: number, z: number, rotationY: number) {
  b.group([x, 0, z], rotationY, () => {
    b.box([0.95, 0.08, 1.9], [0, 0.42, 0], PALETTE.wood);
    b.box([0.85, 0.03, 1.8], [0, 0.47, 0], "#d8bd86");
    for (const [lx, lz] of [
      [-0.42, -0.9],
      [0.42, -0.9],
      [-0.42, 0.9],
      [0.42, 0.9],
    ] as const) {
      b.box([0.07, 0.42, 0.07], [lx, 0.21, lz], PALETTE.darkWood);
    }
  });
}

function buildHouse(b: GeometryBatch, house: HouseSpec, index: number) {
  const random = mulberry32(index + 101);
  const { w, d, h, wall, trim } = house;
  const floors = house.floors ?? 1;
  const top = PLINTH + h * floors;

  // The plinth extends below ground so houses on slopes never float.
  b.box([w + 0.4, PLINTH + 1, d + 0.4], [0, PLINTH / 2 - 0.5, 0], PALETTE.darkStone);
  b.box([w, h * floors, d], [0, PLINTH + (h * floors) / 2, 0], wall);
  if (floors === 2) b.box([w + 0.08, 0.14, d + 0.08], [0, PLINTH + h, 0], trim);

  // Front door with a step.
  const doorX = -w * 0.2;
  b.box([1.05, 2.05, 0.1], [doorX, PLINTH + 1.03, d / 2 + 0.03], trim);
  b.box([0.85, 1.9, 0.12], [doorX, PLINTH + 0.97, d / 2 + 0.04], PALETTE.darkWood);
  b.box([1.4, PLINTH, 0.6], [doorX, PLINTH / 2, d / 2 + 0.5], PALETTE.stone);

  for (let floor = 0; floor < floors; floor++) {
    const y = PLINTH + h * floor + 1.65;
    const lit = random() < 0.35;
    if (floor === 0) {
      windowAt(b, w * 0.22, y, d / 2 + 0.03, 0, trim, lit);
    } else {
      windowAt(b, -w * 0.22, y, d / 2 + 0.03, 0, trim, lit);
      windowAt(b, w * 0.22, y, d / 2 + 0.03, 0, trim, random() < 0.3);
    }
    windowAt(b, w / 2 + 0.03, y, 0, Math.PI / 2, trim, false);
    windowAt(b, -w / 2 - 0.03, y, 0, Math.PI / 2, trim, false);
  }

  if (house.roof === "flat") flatRoof(b, house, top, random() < 0.6);
  else tiledRoof(b, house, top);

  if (random() < 0.4) charpai(b, w * 0.25, d / 2 + 1.8, Math.PI / 2 + (random() - 0.5) * 0.4);
}

export function buildHouses(b: GeometryBatch) {
  HOUSES.forEach((house, index) => {
    onGround(b, house.x, house.z, house.rot, () => buildHouse(b, house, index));
  });
}
