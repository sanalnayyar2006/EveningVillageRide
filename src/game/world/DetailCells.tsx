"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { InstancedMesh } from "three";

/** One grid cell's worth of instances (trees, grass or crops), drawn in full when close. */
export interface DetailCell {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  near: InstancedMesh;
}

/**
 * Every cell of one kind of instance, plus their shared far-off stand-in.
 * Near cells are separate meshes, so the camera and the shadow map skip the
 * ones they can't see. Far away, every cell's instances are copied into one
 * simpler mesh, so distant trees cost a single draw call however many there are.
 */
export interface DetailGroup {
  cells: DetailCell[];
  /** The simpler stand-in, holding the instances of every far cell; null to draw nothing there. */
  far: InstancedMesh | null;
  /** Distance (m) from the camera to a cell's edge where the stand-in takes over. */
  farFrom: number;
  /** Distance (m) beyond which nothing is drawn. */
  hideFrom: number;
}

const Level = { Near: 0, Far: 1, Hidden: 2 } as const;
type Level = (typeof Level)[keyof typeof Level];

/** Seconds between checks: cells change slowly, so there's no need to do this every frame. */
const CHECK_SECONDS = 0.25;
/** A cell must cross a threshold by this much (m) to switch, so it doesn't flicker on the line. */
const HYSTERESIS = 4;

function levelFor(group: DetailGroup, distance: number, current: Level): Level {
  const margin = (threshold: number, goingOut: boolean) =>
    threshold + (goingOut ? HYSTERESIS : -HYSTERESIS);
  const farFrom = margin(group.farFrom, current === Level.Near);
  const hideFrom = margin(group.hideFrom, current !== Level.Hidden);
  if (distance < farFrom) return Level.Near;
  return group.far && distance < hideFrom ? Level.Far : Level.Hidden;
}

/** Copy the instances of every far cell into the group's stand-in mesh. */
function fillFar(group: DetailGroup, levels: Level[]): void {
  const far = group.far;
  if (!far) return;
  let count = 0;
  group.cells.forEach((cell, i) => {
    if (levels[i] !== Level.Far) return;
    const n = cell.near.count;
    far.instanceMatrix.array.set(cell.near.instanceMatrix.array, count * 16);
    if (far.instanceColor && cell.near.instanceColor) {
      far.instanceColor.array.set(cell.near.instanceColor.array, count * 3);
    }
    count += n;
  });
  far.count = count;
  far.visible = count > 0;
  far.instanceMatrix.needsUpdate = true;
  if (far.instanceColor) far.instanceColor.needsUpdate = true;
  far.computeBoundingSphere();
}

/** Draws groups of instance cells, each at the level of detail its distance from the camera calls for. */
export function DetailCells({ groups }: { groups: DetailGroup[] }) {
  const levels = useRef<Level[][]>(groups.map((g) => g.cells.map(() => Level.Near)));
  const sinceCheck = useRef(Infinity);

  useEffect(
    () => () => {
      for (const group of groups) {
        for (const cell of group.cells) cell.near.dispose();
        group.far?.dispose();
      }
    },
    [groups],
  );

  useFrame(({ camera }, delta) => {
    sinceCheck.current += delta;
    if (sinceCheck.current < CHECK_SECONDS) return;
    sinceCheck.current = 0;

    const { x, z } = camera.position;
    groups.forEach((group, g) => {
      const current = (levels.current[g] ??= group.cells.map(() => Level.Near));
      let farChanged = false;
      group.cells.forEach((cell, i) => {
        // Distance to the nearest point of the cell, so nothing pops in right beside you.
        const dx = Math.max(cell.minX - x, 0, x - cell.maxX);
        const dz = Math.max(cell.minZ - z, 0, z - cell.maxZ);
        const level = levelFor(group, Math.hypot(dx, dz), current[i]!);
        if (level === current[i]) return;
        if (level === Level.Far || current[i] === Level.Far) farChanged = true;
        current[i] = level;
        cell.near.visible = level === Level.Near;
      });
      if (farChanged) fillFar(group, current);
    });
  });

  return (
    <>
      {groups.map((group) => (
        <group key={group.cells[0]?.near.uuid ?? group.far?.uuid}>
          {group.cells.map((cell) => (
            <primitive key={cell.near.uuid} object={cell.near} />
          ))}
          {group.far && <primitive object={group.far} />}
        </group>
      ))}
    </>
  );
}
