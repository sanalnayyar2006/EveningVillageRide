"use client";

import { useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { ROADS, type RoadSegment, type RoadSurface } from "./data/layout";
import { heightAt } from "./terrain";
import { WORLD_MATERIALS } from "./worldMaterials";

/** Roads float this far above the terrain to avoid flickering against it. */
const LIFT = 0.04;
/** Sample spacing along a road, so the strip follows bumps in the ground. */
const STEP = 2;
const CAP_SEGMENTS = 16;

type Triangles = number[];

function pushVertex(out: Triangles, x: number, z: number) {
  out.push(x, heightAt(x, z) + LIFT, z);
}

/** A strip of quads along the segment, draped over the terrain. */
function addStrip(out: Triangles, road: RoadSegment) {
  const [ax, az] = road.from;
  const [bx, bz] = road.to;
  const length = Math.hypot(bx - ax, bz - az);
  const steps = Math.max(1, Math.ceil(length / STEP));
  // Unit vector pointing across the road.
  const sideX = -(bz - az) / length;
  const sideZ = (bx - ax) / length;
  const half = road.width / 2;

  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const x0 = ax + (bx - ax) * t0;
    const z0 = az + (bz - az) * t0;
    const x1 = ax + (bx - ax) * t1;
    const z1 = az + (bz - az) * t1;
    // Two triangles per quad, wound so the face points up.
    pushVertex(out, x0 - sideX * half, z0 - sideZ * half);
    pushVertex(out, x0 + sideX * half, z0 + sideZ * half);
    pushVertex(out, x1 + sideX * half, z1 + sideZ * half);
    pushVertex(out, x0 - sideX * half, z0 - sideZ * half);
    pushVertex(out, x1 + sideX * half, z1 + sideZ * half);
    pushVertex(out, x1 - sideX * half, z1 - sideZ * half);
  }
}

/** A round disc at a road end, so junctions and dead ends look rounded instead of cut off. */
function addCap(out: Triangles, [cx, cz]: [number, number], radius: number) {
  for (let i = 0; i < CAP_SEGMENTS; i++) {
    const a0 = (i / CAP_SEGMENTS) * Math.PI * 2;
    const a1 = ((i + 1) / CAP_SEGMENTS) * Math.PI * 2;
    pushVertex(out, cx, cz);
    pushVertex(out, cx + Math.cos(a1) * radius, cz + Math.sin(a1) * radius);
    pushVertex(out, cx + Math.cos(a0) * radius, cz + Math.sin(a0) * radius);
  }
}

function buildRoads(surface: RoadSurface): BufferGeometry {
  const triangles: Triangles = [];
  for (const road of ROADS.filter((r) => r.surface === surface)) {
    addStrip(triangles, road);
    addCap(triangles, road.from, road.width / 2);
    addCap(triangles, road.to, road.width / 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(triangles), 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function Roads() {
  const asphalt = useMemo(() => buildRoads("asphalt"), []);
  const dirt = useMemo(() => buildRoads("dirt"), []);
  return (
    <>
      <mesh geometry={asphalt} material={WORLD_MATERIALS.asphalt} receiveShadow />
      <mesh geometry={dirt} material={WORLD_MATERIALS.dirtRoad} receiveShadow />
    </>
  );
}
