/**
 * Video watermark geometry, ROI calculations, and template-based alpha blending.
 * Exact logic ported from E:\Coding\bhushan\gemini-watermark-remover.
 */

import type { Rect } from "../watermark/types";
import type { VideoTunerSettings, VideoWatermarkBox } from "./types";

export const VIDEO_DEFAULTS: VideoTunerSettings = {
  gain: 0.6,
  offsetX: -24,
  offsetY: -24,
  sizeScale: 1,
};

export const VIDEO_PRESETS = [
  {
    id: "veo" as const,
    label: "Veo videos (default)",
    desc: "Current Veo downloads - watermark slightly inset from the bottom-right corner.",
    settings: { gain: 0.6, offsetX: -24, offsetY: -24, sizeScale: 1 },
  },
  {
    id: "corner" as const,
    label: "Classic corner",
    desc: "Watermark right in the bottom-right corner.",
    settings: { gain: 0.6, offsetX: 0, offsetY: 0, sizeScale: 1 },
  },
];

/**
 * Default Veo watermark box (bottom-right): size ~ shortSide/15, margin ~ shortSide/10.
 * Dynamic scaling matches all aspect ratios and resolutions (portrait/landscape).
 */
export function getVeoWatermark(width: number, height: number): VideoWatermarkBox {
  const base = Math.min(width, height);
  const size = Math.max(24, Math.min(Math.round(base / 15), base));
  const margin = Math.round(base / 10);
  return {
    size,
    x: Math.max(0, width - margin - size),
    y: Math.max(0, height - margin - size),
    width: size,
    height: size,
  };
}

/**
 * Calculates ROI bounding box around watermark with padding.
 */
export function getRoi(width: number, height: number, wm: VideoWatermarkBox): Rect {
  const pad = Math.round(wm.size * 0.6);
  const rx = Math.max(0, wm.x - pad);
  const ry = Math.max(0, wm.y - pad);
  const rw = Math.min(width - rx, wm.width + pad * 2);
  const rh = Math.min(height - ry, wm.height + pad * 2);
  return { x: rx, y: ry, width: rw, height: rh };
}

/**
 * Resolves final watermark box applying user offsets and size scaling.
 */
export function resolveBox(
  base: VideoWatermarkBox,
  width: number,
  height: number,
  opts: Partial<VideoTunerSettings> = {},
): VideoWatermarkBox {
  const sizeScale = opts.sizeScale || 1;
  const size = Math.max(8, Math.min(Math.round(base.size * sizeScale), Math.min(width, height)));
  const x = Math.max(0, Math.min(base.x + Math.round(opts.offsetX || 0), width - size));
  const y = Math.max(0, Math.min(base.y + Math.round(opts.offsetY || 0), height - size));
  return { size, x, y, width: size, height: size };
}

/**
 * Builds scaled Gemini sparkle alpha template shape placed inside the ROI, scaled by gain.
 */
export function buildAlpha(
  bgImg: CanvasImageSource,
  roi: Rect,
  wm: VideoWatermarkBox,
  gain: number,
): Float32Array {
  const count = roi.width * roi.height;
  const alphaMap = new Float32Array(count);
  const offX = wm.x - roi.x;
  const offY = wm.y - roi.y;

  const c = document.createElement("canvas");
  c.width = wm.size;
  c.height = wm.size;
  const cx = c.getContext("2d", { willReadFrequently: true });
  if (!cx) return alphaMap;

  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = "high";
  cx.drawImage(bgImg, 0, 0, wm.size, wm.size);
  const data = cx.getImageData(0, 0, wm.size, wm.size).data;

  for (let row = 0; row < wm.size; row++) {
    for (let col = 0; col < wm.size; col++) {
      const ri = (offY + row) * roi.width + (offX + col);
      if (ri < 0 || ri >= count) continue;
      const o = (row * wm.size + col) * 4;
      const a = (Math.max(data[o], data[o + 1], data[o + 2]) / 255) * gain;
      alphaMap[ri] = a > 0 ? Math.min(a, 0.99) : 0;
    }
  }
  return alphaMap;
}

const ALPHA_THRESHOLD = 0.002;
const MAX_ALPHA = 0.99;
const LOGO_VALUE = 255;

/**
 * In-place reverse alpha blending on ImageData.
 */
export function removeWatermark(
  imageData: ImageData,
  alphaMap: Float32Array,
  position: Rect,
  options: { alphaGain?: number } = {},
) {
  const { x, y, width, height } = position;
  const gain = Number.isFinite(options.alphaGain) && (options.alphaGain ?? 0) > 0
    ? (options.alphaGain ?? 1)
    : 1;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const imgIdx = ((y + row) * imageData.width + (x + col)) * 4;
      const alphaIdx = row * width + col;

      let alpha = alphaMap[alphaIdx] * gain;
      if (alpha < ALPHA_THRESHOLD) continue;
      alpha = Math.min(alpha, MAX_ALPHA);

      for (let c = 0; c < 3; c++) {
        const watermarked = imageData.data[imgIdx + c];
        // Reverse Alpha Blending Formula
        const original = (watermarked - alpha * LOGO_VALUE) / (1.0 - alpha);
        imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
      }
    }
  }
}

/**
 * Cleans a full-frame ImageData in place. Returns resolved box + ROI for UI guides.
 */
export function cleanFrame(
  bgImg: CanvasImageSource,
  imageData: ImageData,
  width: number,
  height: number,
  base: VideoWatermarkBox,
  opts: Partial<VideoTunerSettings> = {},
): { wm: VideoWatermarkBox; roi: Rect } {
  const wm = resolveBox(base, width, height, opts);
  const roi = getRoi(width, height, wm);
  const alpha = buildAlpha(bgImg, roi, wm, opts.gain ?? VIDEO_DEFAULTS.gain);
  removeWatermark(imageData, alpha, {
    x: roi.x,
    y: roi.y,
    width: roi.width,
    height: roi.height,
  });
  return { wm, roi };
}
