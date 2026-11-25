"use client";

import { Crops } from "./Crops";
import { Horizon } from "./Horizon";
import { PowerLines } from "./PowerLines";
import { Roads } from "./Roads";
import { Scenery } from "./Scenery";
import { Signs } from "./Signs";
import { StaticColliders } from "./StaticColliders";
import { TerrainMesh } from "./TerrainMesh";
import { Vegetation } from "./Vegetation";
import { Water } from "./Water";

/** The whole village. Must be mounted inside <Physics> for its colliders. */
export function World() {
  return (
    <>
      <Horizon />
      <TerrainMesh />
      <Water />
      <Roads />
      <Scenery />
      <Vegetation />
      <Crops />
      <PowerLines />
      <Signs />
      <StaticColliders />
    </>
  );
}
