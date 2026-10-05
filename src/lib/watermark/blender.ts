/**
 * Mathematical reverse alpha blending engine.
 * Exact inversion of Google Gemini's alpha compositing formula:
 *
 *   Watermarked = alpha * Logo + (1 - alpha) * Original
 *   Original    = (Watermarked - alpha * Logo) / (1 - alpha)
 */

import type { FloatMat, Rect } from "./types";

export interface BlendOptions {
  logoValue?: number; // Brightness of the logo, default 255.0
  alphaThreshold?: number; // Ignore tiny alpha noise, default 0.002
  maxAlpha?: number; // Clamp maximum alpha to prevent division by near-zero, default 0.99
}

/**
 * Applies mathematically exact reverse alpha blending in-place on RGBA pixel data.
 *
 * @param rgba - The 32-bit RGBA pixel buffer (ImageData.data)
 * @param imageWidth - Total width of the image
 * @param imageHeight - Total height of the image
 * @param alphaMap - The 2D float matrix of alpha values [0.0, 1.0]
 * @param position - The top-left {x, y} coordinates of the watermark
 * @param options - Tuning parameters
 */
export function removeWatermarkAlphaBlend(
  rgba: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  alphaMap: FloatMat,
  position: { x: number; y: number },
  options?: BlendOptions,
): Rect {
  const logoValue = options?.logoValue ?? 255.0;
  const alphaThreshold = options?.alphaThreshold ?? 0.002;
  const maxAlpha = options?.maxAlpha ?? 0.99;

  // Compute intersection with image boundaries
  const x1 = Math.max(0, position.x);
  const y1 = Math.max(0, position.y);
  const x2 = Math.min(imageWidth, position.x + alphaMap.width);
  const y2 = Math.min(imageHeight, position.y + alphaMap.height);

  if (x1 >= x2 || y1 >= y2) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const roiWidth = x2 - x1;
  const roiHeight = y2 - y1;
  const alphaOffsetX = x1 - position.x;
  const alphaOffsetY = y1 - position.y;

  for (let row = 0; row < roiHeight; row++) {
    const imgY = y1 + row;
    const alphaY = alphaOffsetY + row;
    const imgRowOffset = imgY * imageWidth;
    const alphaRowOffset = alphaY * alphaMap.width;

    for (let col = 0; col < roiWidth; col++) {
      const alphaVal = alphaMap.data[alphaRowOffset + (alphaOffsetX + col)];

      if (alphaVal < alphaThreshold) {
        continue;
      }

      const alpha = Math.min(alphaVal, maxAlpha);
      const oneMinusAlpha = 1.0 - alpha;
      const alphaLogo = alpha * logoValue;

      const pxIndex = (imgRowOffset + (x1 + col)) * 4;

      // Invert Red channel
      const r = (rgba[pxIndex] - alphaLogo) / oneMinusAlpha;
      rgba[pxIndex] = r < 0 ? 0 : r > 255 ? 255 : Math.round(r);

      // Invert Green channel
      const g = (rgba[pxIndex + 1] - alphaLogo) / oneMinusAlpha;
      rgba[pxIndex + 1] = g < 0 ? 0 : g > 255 ? 255 : Math.round(g);

      // Invert Blue channel
      const b = (rgba[pxIndex + 2] - alphaLogo) / oneMinusAlpha;
      rgba[pxIndex + 2] = b < 0 ? 0 : b > 255 ? 255 : Math.round(b);

      // Alpha channel rgba[pxIndex + 3] remains untouched (usually 255)
    }
  }

  return { x: x1, y: y1, width: roiWidth, height: roiHeight };
}
