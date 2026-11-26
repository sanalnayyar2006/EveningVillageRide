"use client";

import { useEffect, useMemo } from "react";
import type { BufferGeometry } from "three";
import { GeometryBatch } from "./batch";
import { buildBanyan } from "./landmarks/banyan";
import { buildBusStop } from "./landmarks/busStop";
import { buildFields } from "./landmarks/fields";
import { buildGate } from "./landmarks/gate";
import { buildHospital } from "./landmarks/hospital";
import { buildMarket } from "./landmarks/market";
import { buildPond } from "./landmarks/pond";
import { buildSchool } from "./landmarks/school";
import { buildSubstation } from "./landmarks/substation";
import { buildTeaStall } from "./landmarks/teaStall";
import { buildTemple } from "./landmarks/temple";
import { buildWaterTank } from "./landmarks/waterTank";
import { buildHouses } from "./scenery/houses";
import { buildProps } from "./scenery/props";
import { WORLD_MATERIALS } from "./worldMaterials";

/**
 * Each builder becomes its own merged mesh. One mesh per area keeps draw calls
 * low while still letting three.js skip whatever is off screen.
 */
const BUILDERS: Record<string, (b: GeometryBatch) => void> = {
  houses: buildHouses,
  gate: buildGate,
  busStop: buildBusStop,
  banyan: buildBanyan,
  teaStall: buildTeaStall,
  market: buildMarket,
  temple: buildTemple,
  pond: buildPond,
  school: buildSchool,
  waterTank: buildWaterTank,
  hospital: buildHospital,
  substation: buildSubstation,
  fields: buildFields,
  props: buildProps,
};

interface BuiltPiece {
  name: string;
  solid: BufferGeometry | null;
  glow: BufferGeometry | null;
}

/** All hand-built scenery: houses, landmarks and props. */
export function Scenery() {
  const pieces = useMemo<BuiltPiece[]>(
    () =>
      Object.entries(BUILDERS).map(([name, build]) => {
        const batch = new GeometryBatch();
        build(batch);
        return { name, solid: batch.build("main"), glow: batch.build("glow") };
      }),
    [],
  );

  useEffect(
    () => () =>
      pieces.forEach((piece) => {
        piece.solid?.dispose();
        piece.glow?.dispose();
      }),
    [pieces],
  );

  return (
    <>
      {pieces.map(({ name, solid, glow }) => (
        <group key={name} name={name}>
          {solid && (
            <mesh geometry={solid} material={WORLD_MATERIALS.painted} castShadow receiveShadow />
          )}
          {glow && <mesh geometry={glow} material={WORLD_MATERIALS.glow} />}
        </group>
      ))}
    </>
  );
}
