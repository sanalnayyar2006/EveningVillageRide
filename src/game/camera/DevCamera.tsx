"use client";

import { OrbitControls } from "@react-three/drei";
import { PLAYER_SPAWN } from "@/game/player/PlayerPlaceholder";

/** Temporary inspection camera. Phase 1 replaces it with the ride camera. */
export function DevCamera() {
  return (
    <OrbitControls
      makeDefault
      target={[PLAYER_SPAWN[0], 1, PLAYER_SPAWN[2]]}
      minDistance={3}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2 - 0.05}
      enableDamping
    />
  );
}
