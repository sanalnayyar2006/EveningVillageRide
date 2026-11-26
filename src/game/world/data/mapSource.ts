// The village is traced from a satellite screenshot (RULES/map/). Every position
// in the map data is written in screenshot pixels and converted to metres here,
// so a re-trace, a new scale or a bigger screenshot only touches this file and
// the traced data, never the code that uses it.

export type Point = [number, number];

export const MAP = {
  /** Screenshot size in pixels. */
  imageSize: [1086, 916] as Point,
  /** Measured from the highway (~18 m wide, ~48 px) and typical house footprints. */
  metresPerPixel: 0.38,
  /** This pixel becomes the world origin (0, 0). */
  origin: [543, 458] as Point,
} as const;

/** Screenshot pixel → world metres. Image down (+v) is south, which is +Z in the world. */
export const px = (u: number, v: number): Point => [
  (u - MAP.origin[0]) * MAP.metresPerPixel,
  (v - MAP.origin[1]) * MAP.metresPerPixel,
];

/** A pixel distance in metres. */
export const pxLength = (pixels: number) => pixels * MAP.metresPerPixel;

/** A traced pixel polyline or polygon in metres. */
export const pxPath = (points: readonly Point[]): Point[] => points.map(([u, v]) => px(u, v));

/** World-space rectangle covered by the screenshot. */
export const MAP_BOUNDS = (() => {
  const [minX, minZ] = px(0, 0);
  const [maxX, maxZ] = px(MAP.imageSize[0], MAP.imageSize[1]);
  return { minX, maxX, minZ, maxZ };
})();
