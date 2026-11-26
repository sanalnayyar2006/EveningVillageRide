import type { Material } from "three";

/**
 * Wind sway for vegetation. A shader patch bends every instance with its
 * height above its own base (treetops move, trunks don't), each one slightly
 * out of step with its neighbours so the canopy ripples instead of rocking as one.
 */
export const windUniforms = {
  uWindTime: { value: 0 },
  /** 0..1 from ambientState.windStrength(). */
  uWindStrength: { value: 0 },
};

/** Patch a MeshStandardMaterial used by InstancedMeshes. Call before its first render. */
export function addWindSway(material: Material): void {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, windUniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uWindTime;
uniform float uWindStrength;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec2 base = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
  float wave = sin(uWindTime * 1.6 + base.x * 0.31 + base.y * 0.23)
             + 0.45 * sin(uWindTime * 3.7 + base.x * 0.9);
  // Bend grows with the square of height, like a stem or trunk flexing.
  float bend = (0.12 + uWindStrength) * 0.018 * transformed.y * transformed.y;
  transformed.x += wave * bend;
  transformed.z += wave * bend * 0.6;
#endif`,
      );
  };
  material.needsUpdate = true;
}
