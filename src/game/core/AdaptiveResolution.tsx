"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useSettingsStore } from "@/store/settingsStore";
import { qualityFor } from "./quality";

/** Resolution only changes in steps this big, so it doesn't creep up and down every second. */
const DPR_STEP = 0.25;

/**
 * Watches the frame rate and lowers the rendering resolution when it drops,
 * raising it again once there's headroom. If it keeps flip-flopping, it settles
 * on the lowest resolution for the rest of the session.
 */
export function AdaptiveResolution() {
  const setDpr = useThree((state) => state.setDpr);
  const { maxDpr } = qualityFor(useSettingsStore((s) => s.highQuality));
  const native = typeof window === "undefined" ? 1 : window.devicePixelRatio;
  const ceiling = Math.min(maxDpr, native);

  const apply = (factor: number) => {
    const dpr = 1 + (ceiling - 1) * factor;
    setDpr(Math.max(1, Math.round(dpr / DPR_STEP) * DPR_STEP));
  };

  return (
    <PerformanceMonitor
      factor={1}
      flipflops={4}
      onChange={({ factor }) => apply(factor)}
      onFallback={() => setDpr(1)}
    />
  );
}
