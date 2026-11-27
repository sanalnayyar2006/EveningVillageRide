/**
 * The two quality levels in Settings. "High" still adapts: the resolution
 * steps down from its maximum whenever the frame rate drops (AdaptiveResolution).
 */
const QUALITY = {
  high: {
    /** Highest device-pixel ratio the canvas renders at. */
    maxDpr: 1.5,
    /** MSAA samples in the post-processing buffers. */
    multisampling: 4,
    shadowMapSize: 2048,
  },
  balanced: {
    maxDpr: 1,
    multisampling: 2,
    shadowMapSize: 1024,
  },
} as const;

export type QualityLevel = (typeof QUALITY)[keyof typeof QUALITY];

export const qualityFor = (highQuality: boolean): QualityLevel =>
  highQuality ? QUALITY.high : QUALITY.balanced;
