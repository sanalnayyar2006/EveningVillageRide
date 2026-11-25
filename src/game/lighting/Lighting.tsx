"use client";

import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3, type DirectionalLight } from "three";
import { useBikeStore } from "@/store/bikeStore";
import { useSettingsStore } from "@/store/settingsStore";
import { GOLDEN_HOUR as G } from "./lightingConfig";

const SUN_DIRECTION = new Vector3(...G.sunDirection).normalize();
const SUN_DISTANCE = 120;
const SKY_SUN_POSITION = SUN_DIRECTION.clone().multiplyScalar(SUN_DISTANCE).toArray();
const SHADOW_EXTENT = G.shadowExtent;
const SHADOW_MAP_SIZE = 2048;
/** World size of one shadow-map pixel. */
const SHADOW_TEXEL = (SHADOW_EXTENT * 2) / SHADOW_MAP_SIZE;

// The shadow camera's own axes, used to snap its movement to whole texels.
const LIGHT_RIGHT = new Vector3().crossVectors(new Vector3(0, 1, 0), SUN_DIRECTION).normalize();
const LIGHT_UP = new Vector3().crossVectors(SUN_DIRECTION, LIGHT_RIGHT).normalize();

const focus = new Vector3();
const snapped = new Vector3();

/**
 * Where the shadow camera should centre: the rider, rounded to whole shadow
 * texels so shadows don't shimmer as the camera follows.
 */
function snappedShadowCentre(point: Vector3, out: Vector3): Vector3 {
  const right = Math.round(point.dot(LIGHT_RIGHT) / SHADOW_TEXEL) * SHADOW_TEXEL;
  const up = Math.round(point.dot(LIGHT_UP) / SHADOW_TEXEL) * SHADOW_TEXEL;
  const depth = point.dot(SUN_DIRECTION);
  return out
    .copy(LIGHT_RIGHT)
    .multiplyScalar(right)
    .addScaledVector(LIGHT_UP, up)
    .addScaledVector(SUN_DIRECTION, depth);
}

/** Sun, sky, ambient fill and fog. Every light in the scene lives here. */
export function Lighting() {
  const shadows = useSettingsStore((s) => s.shadows);
  const sun = useRef<DirectionalLight>(null);

  // The shadow map only covers a small square, so it travels with the rider.
  useFrame(() => {
    const light = sun.current;
    if (!light) return;
    const { x, y, z } = useBikeStore.getState().telemetry;
    snappedShadowCentre(focus.set(x, y, z), snapped);
    light.position.copy(snapped).addScaledVector(SUN_DIRECTION, SUN_DISTANCE);
    light.target.position.copy(snapped);
    light.target.updateMatrixWorld();
  });

  return (
    <>
      <Sky
        distance={4500}
        sunPosition={SKY_SUN_POSITION}
        turbidity={G.sky.turbidity}
        rayleigh={G.sky.rayleigh}
        mieCoefficient={G.sky.mieCoefficient}
        mieDirectionalG={G.sky.mieDirectionalG}
      />
      <fog attach="fog" args={[G.fogColor, G.fogNear, G.fogFar]} />
      <hemisphereLight args={[G.skyColor, G.groundColor, G.hemisphereIntensity]} />
      <directionalLight
        ref={sun}
        color={G.sunColor}
        intensity={G.sunIntensity}
        castShadow={shadows}
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
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
