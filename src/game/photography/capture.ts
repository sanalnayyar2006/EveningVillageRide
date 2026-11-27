import { PHOTO_CONFIG } from "./photoConfig";

export interface CapturedImage {
  image: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
}

const { maxWidth, aspect, thumbWidth, quality } = PHOTO_CONFIG.capture;

/** The centred 16:9 part of a `width` × `height` view; the HUD frames the same area. */
function photoFrame(width: number, height: number) {
  const frameWidth = Math.min(width, height * aspect);
  const frameHeight = frameWidth / aspect;
  return {
    x: (width - frameWidth) / 2,
    y: (height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
  };
}

function scaledCopy(source: CanvasImageSource, crop: ReturnType<typeof photoFrame>, width: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(width / aspect);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const toJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("JPEG encoding failed"))),
      "image/jpeg",
      quality,
    ),
  );

/**
 * Photographs the frame just drawn to `canvas`, without the HUD (which is
 * HTML, not part of the canvas). Call it right after the frame is rendered:
 * the WebGL drawing buffer only holds the image until the browser composites,
 * so the copy must happen before any await.
 */
export async function capturePhoto(canvas: HTMLCanvasElement): Promise<CapturedImage> {
  const crop = photoFrame(canvas.width, canvas.height);
  const full = scaledCopy(canvas, crop, Math.min(maxWidth, crop.width));
  const thumb = scaledCopy(
    full,
    { x: 0, y: 0, width: full.width, height: full.height },
    thumbWidth,
  );

  const [image, thumbnail] = await Promise.all([toJpeg(full), toJpeg(thumb)]);
  return { image, thumbnail, width: full.width, height: full.height };
}
