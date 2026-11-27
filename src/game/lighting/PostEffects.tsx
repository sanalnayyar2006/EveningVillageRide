"use client";

import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode, type BloomEffect } from "postprocessing";
import { useRef } from "react";
import { ambient } from "@/game/ambient/ambientState";
import { FRAME_ORDER } from "@/game/core/frameOrder";
import { qualityFor } from "@/game/core/quality";
import { useSettingsStore } from "@/store/settingsStore";
import { smoothstep } from "@/utils/math";
import { BLOOM, GRADE } from "./lightingConfig";

/**
 * Draws every frame: bloom on the sun, lamps and lit windows, then ACES tone
 * mapping, a warm grade and a soft vignette. Tone mapping happens here rather
 * than in the renderer, so bloom works on the scene's full brightness.
 */
export function PostEffects() {
  const effects = useSettingsStore((s) => s.effects);
  const { multisampling } = qualityFor(useSettingsStore((s) => s.highQuality));
  const bloom = useRef<BloomEffect>(null);

  useFrame(({ gl }) => {
    // The composer draws in several passes; count them all as one frame (see debug renderStats).
    gl.info.reset();
    // Lamps barely glow against the sunset; once dusk falls they halo.
    if (!bloom.current) return;
    const dusk = smoothstep(0.3, 1, ambient.dayProgress);
    bloom.current.intensity = BLOOM.golden + (BLOOM.dusk - BLOOM.golden) * dusk;
  }, FRAME_ORDER.render - 0.5);

  return (
    <EffectComposer renderPriority={FRAME_ORDER.render} multisampling={multisampling}>
      {effects ? (
        <>
          <Bloom
            ref={bloom}
            mipmapBlur
            // A soft glow doesn't need full resolution.
            resolutionScale={0.5}
            luminanceThreshold={BLOOM.threshold}
            luminanceSmoothing={BLOOM.smoothing}
            intensity={BLOOM.golden}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <HueSaturation saturation={GRADE.saturation} />
          <BrightnessContrast contrast={GRADE.contrast} />
          <Vignette offset={GRADE.vignetteOffset} darkness={GRADE.vignetteDarkness} />
        </>
      ) : (
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      )}
    </EffectComposer>
  );
}
