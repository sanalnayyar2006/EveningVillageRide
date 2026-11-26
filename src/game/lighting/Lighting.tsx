"use client";

import { Sky } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type ComponentRef } from "react";
import { Color, Vector3, type DirectionalLight, type Fog, type HemisphereLight } from "three";
import { ambient } from "@/game/ambient/ambientState";
import { WORLD_MATERIALS } from "@/game/world/worldMaterials";
import { useBikeStore } from "@/store/bikeStore";
import { useSettingsStore } from "@/store/settingsStore";
import { smoothstep } from "@/utils/math";
import { DUSK, GLOW, GOLDEN_HOUR as G } from "./lightingConfig";

const GOLDEN_SUN = new Vector3(...G.sunDirection).normalize();
const SUN_DISTANCE = 120;
const SKY_SUN_POSITION = GOLDEN_SUN.clone().multiplyScalar(SUN_DISTANCE).toArray();
const SHADOW_EXTENT = G.shadowExtent;
const SHADOW_MAP_SIZE = 2048;
/** World size of one shadow-map pixel. */
const SHADOW_TEXEL = (SHADOW_EXTENT * 2) / SHADOW_MAP_SIZE;

/** The two ends of the evening, as colours ready to blend. */
const FROM = {
  sun: new Color(G.sunColor),
  sky: new Color(G.skyColor),
  ground: new Color(G.groundColor),
  fog: new Color(G.fogColor),
};
const TO = {
  sun: new Color(DUSK.sunColor),
  sky: new Color(DUSK.skyColor),
  ground: new Color(DUSK.groundColor),
  fog: new Color(DUSK.fogColor),
};

// Rebuilt every frame as the sun moves.
const sunDirection = GOLDEN_SUN.clone();
const lightRight = new Vector3();
const lightUp = new Vector3();
const UP = new Vector3(0, 1, 0);

/** Point the sun for evening progress `p`: same compass bearing, sinking towards the hills. */
function sunAt(p: number, out: Vector3): Vector3 {
  const flat = Math.hypot(GOLDEN_SUN.x, GOLDEN_SUN.z);
  const elevation = G.sunDirection[1] + (DUSK.sunElevation - G.sunDirection[1]) * p;
  out.set(GOLDEN_SUN.x / flat, elevation, GOLDEN_SUN.z / flat).normalize();
  // The shadow camera's own axes, used to snap its movement to whole texels.
  lightRight.crossVectors(UP, out).normalize();
  lightUp.crossVectors(out, lightRight).normalize();
  return out;
}

sunAt(0, sunDirection);
const focus = new Vector3();
const snapped = new Vector3();

/**
 * Where the shadow camera should centre: the rider, rounded to whole shadow
 * texels so shadows don't shimmer as the camera follows.
 */
function snappedShadowCentre(point: Vector3, out: Vector3): Vector3 {
  const right = Math.round(point.dot(lightRight) / SHADOW_TEXEL) * SHADOW_TEXEL;
  const up = Math.round(point.dot(lightUp) / SHADOW_TEXEL) * SHADOW_TEXEL;
  const depth = point.dot(sunDirection);
  return out
    .copy(lightRight)
    .multiplyScalar(right)
    .addScaledVector(lightUp, up)
    .addScaledVector(sunDirection, depth);
}

/** Sun, sky, ambient fill and fog, slowly turning from golden hour to dusk. Every light lives here. */
export function Lighting() {
  const shadows = useSettingsStore((s) => s.shadows);
  const sun = useRef<DirectionalLight>(null);
  const fill = useRef<HemisphereLight>(null);
  const sky = useRef<ComponentRef<typeof Sky>>(null);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useFrame(() => {
    const light = sun.current;
    if (!light) return;
    // Ease in and out so the change is never noticeable from one minute to the next.
    const p = smoothstep(0, 1, ambient.dayProgress);
    sunAt(p, sunDirection);

    light.color.lerpColors(FROM.sun, TO.sun, p);
    light.intensity = G.sunIntensity + (DUSK.sunIntensity - G.sunIntensity) * p;
    // The lower the sun, the more its shadows need pushing off surfaces to avoid acne stripes.
    light.shadow.normalBias = 0.04 + 0.1 * p;
    light.shadow.bias = -0.0004 - 0.0012 * p;
    if (fill.current) {
      fill.current.color.lerpColors(FROM.sky, TO.sky, p);
      fill.current.groundColor.lerpColors(FROM.ground, TO.ground, p);
      fill.current.intensity =
        G.hemisphereIntensity + (DUSK.hemisphereIntensity - G.hemisphereIntensity) * p;
    }
    (scene.fog as Fog | null)?.color.lerpColors(FROM.fog, TO.fog, p);
    gl.toneMappingExposure = G.exposure + (DUSK.exposure - G.exposure) * p;
    sky.current?.material.uniforms.sunPosition?.value
      .copy(sunDirection)
      .multiplyScalar(SUN_DISTANCE);
    WORLD_MATERIALS.glow.emissiveIntensity =
      GLOW.golden + (GLOW.dusk - GLOW.golden) * smoothstep(0.3, 1, ambient.dayProgress);

    // The shadow map only covers a small square, so it travels with the rider.
    const { x, y, z } = useBikeStore.getState().telemetry;
    snappedShadowCentre(focus.set(x, y, z), snapped);
    light.position.copy(snapped).addScaledVector(sunDirection, SUN_DISTANCE);
    light.target.position.copy(snapped);
    light.target.updateMatrixWorld();
  });

  return (
    <>
      <Sky
        ref={sky}
        distance={4500}
        sunPosition={SKY_SUN_POSITION}
        turbidity={G.sky.turbidity}
        rayleigh={G.sky.rayleigh}
        mieCoefficient={G.sky.mieCoefficient}
        mieDirectionalG={G.sky.mieDirectionalG}
      />
      <fog attach="fog" args={[G.fogColor, G.fogNear, G.fogFar]} />
      <hemisphereLight ref={fill} args={[G.skyColor, G.groundColor, G.hemisphereIntensity]} />
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
