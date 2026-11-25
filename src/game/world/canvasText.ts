import { CanvasTexture, SRGBColorSpace } from "three";

interface SignStyle {
  lines: string[];
  background: string;
  color: string;
  /** Canvas pixels per metre of sign. */
  resolution?: number;
  border?: string;
}

/**
 * Draws sign text onto a canvas texture using the system's fonts, so signs
 * (including Devanagari) need no font download.
 */
export function createSignTexture(width: number, height: number, style: SignStyle): CanvasTexture {
  const resolution = style.resolution ?? 128;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * resolution);
  canvas.height = Math.round(height * resolution);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (style.border) {
    ctx.strokeStyle = style.border;
    ctx.lineWidth = canvas.height * 0.06;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  const lineHeight = canvas.height / style.lines.length;
  ctx.fillStyle = style.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  style.lines.forEach((line, i) => {
    ctx.font = `bold ${Math.round(lineHeight * 0.62)}px "Kohinoor Devanagari", "Noto Sans Devanagari", "Mukta", system-ui, sans-serif`;
    ctx.fillText(line, canvas.width / 2, lineHeight * (i + 0.5), canvas.width * 0.92);
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
