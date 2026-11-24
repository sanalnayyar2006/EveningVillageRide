"use client";

import { Sky } from "@react-three/drei";
import { useMemo } from "react";
import { Vector3 } from "three";
import { useSettingsStore } from "@/store/settingsStore";
import { GOLDEN_HOUR as G } from "./lightingConfig";

/** Sun, sky, ambient fill and fog. Owns every light in the scene. */
export function Lighting() {
  const shadows = useSettingsStore((s) => s.shadows);
  const sunPosition = useMemo(
    () => new Vector3(...G.sunDirection).normalize().multiplyScalar(120),
    [],
  );
  const e = G.shadowExtent;

  return (
    <>
      <Sky
        distance={4500}
        sunPosition={sunPosition.toArray()}
        turbidity={G.sky.turbidity}
        rayleigh={G.sky.rayleigh}
        mieCoefficient={G.sky.mieCoefficient}
        mieDirectionalG={G.sky.mieDirectionalG}
      />
      <fog attach="fog" args={[G.fogColor, G.fogNear, G.fogFar]} />
      <hemisphereLight args={[G.skyColor, G.groundColor, G.hemisphereIntensity]} />
      <directionalLight
        position={sunPosition}
        color={G.sunColor}
        intensity={G.sunIntensity}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-e}
        shadow-camera-right={e}
        shadow-camera-top={e}
        shadow-camera-bottom={-e}
        shadow-camera-near={1}
        shadow-camera-far={300}
      />
    </>
  );
}
