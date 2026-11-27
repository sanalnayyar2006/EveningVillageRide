import { Color, type MeshStandardMaterial } from "three";

/**
 * Moving water for the pond and stream. A shader patch on a standard material:
 * a few travelling waves tilt the surface normal, so the low sun glints off the
 * ripples, and at grazing angles the water mirrors the sky (Fresnel), the way a
 * pond looks from a bicycle saddle.
 */
export const waterUniforms = {
  uWaterTime: { value: 0 },
  /** What the water reflects at a glance: the sky near the horizon, in scene (pre-tone-map) light. */
  uWaterSky: { value: new Color("#ffd9b0") },
};

/** Direction (x, z), wavelength (m), speed (m/s) and height (m) of each wave. */
const WAVES = [
  [0.8, 0.6, 3.1, 0.6, 0.012],
  [-0.5, 0.86, 1.7, 0.45, 0.008],
  [0.2, -0.98, 0.9, 0.35, 0.005],
  [-0.9, -0.3, 0.55, 0.25, 0.003],
] as const;

const glsl = (n: number) => n.toFixed(4);

/**
 * GLSL that adds each wave's slope at `p` to `slope`. A wave fades out where
 * a pixel covers more than about half its wavelength, so distant water goes
 * smooth instead of breaking into stripes.
 */
const waveSlopes = WAVES.map(([dx, dz, length, speed, height]) => {
  const k = (2 * Math.PI) / length;
  const dir = `vec2(${glsl(dx)}, ${glsl(dz)})`;
  const fade = `(1.0 - smoothstep(0.08, 0.3, footprint / ${glsl(length)}))`;
  return `slope += ${dir} * ${glsl(height * k)} * ${fade} * cos(dot(${dir}, p) * ${glsl(k)} - uWaterTime * ${glsl(speed * k)});`;
}).join("\n  ");

/** Most of the colour comes from the sky at a glance; looking straight down shows the water. */
const MAX_REFLECTION = 0.7;

export function addWaterSurface(material: MeshStandardMaterial): void {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, waterUniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWaterPosition;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vWaterPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uWaterTime;
uniform vec3 uWaterSky;
varying vec3 vWaterPosition;

vec3 rippledNormal(vec2 p) {
  vec2 slope = vec2(0.0);
  float footprint = length(fwidth(p));
  ${waveSlopes}
  return normalize(vec3(-slope.x, 1.0, -slope.y));
}`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
normal = normalize((viewMatrix * vec4(rippledNormal(vWaterPosition.xz), 0.0)).xyz);`,
      )
      .replace(
        "#include <opaque_fragment>",
        `float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
outgoingLight = mix(outgoingLight, uWaterSky, min(fresnel, ${glsl(MAX_REFLECTION)}));
#include <opaque_fragment>`,
      );
  };
  material.needsUpdate = true;
}
