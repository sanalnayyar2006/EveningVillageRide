"use client";

import { Sky } from "@react-three/drei";
import { Vector3 } from "three";
import { useSettingsStore } from "@/store/settingsStore";
import { GOLDEN_HOUR as G } from "./lightingConfig";

const SUN_POSITION = new Vector3(...G.sunDirection).normalize().multiplyScalar(120);
const SHADOW_EXTENT = G.shadowExtent;

/** Sun, sky, ambient fill and fog. Every light in the scene lives here. */
export function Lighting() {
  const shadows = useSettingsStore((s) => s.shadows);

  return (
    <>
      <Sky
        distance={4500}
        sunPosition={SUN_POSITION.toArray()}
        turbidity={G.sky.turbidity}
        rayleigh={G.sky.rayleigh}
        mieCoefficient={G.sky.mieCoefficient}
        mieDirectionalG={G.sky.mieDirectionalG}
      />
      <fog attach="fog" args={[G.fogColor, G.fogNear, G.fogFar]} />
      <hemisphereLight args={[G.skyColor, G.groundColor, G.hemisphereIntensity]} />
      <directionalLight
        position={SUN_POSITION}
        color={G.sunColor}
        intensity={G.sunIntensity}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={300}
      />
    </>
  );
}
