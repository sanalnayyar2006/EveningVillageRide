"use client";

import { Physics } from "@react-three/rapier";
import { DevCamera } from "./camera/DevCamera";
import { Lighting } from "./lighting/Lighting";
import { PlayerPlaceholder } from "./player/PlayerPlaceholder";
import { Ground } from "./world/Ground";

/** Scene graph root (Architecture.md §10). */
export function Scene() {
  return (
    <>
      <Lighting />
      <DevCamera />
      <Physics>
        <Ground />
        <PlayerPlaceholder />
      </Physics>
    </>
  );
}
