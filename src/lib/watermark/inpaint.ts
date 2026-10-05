/**
 * Gradient-weighted soft inpainting (Gaussian residual cleanup).
 * Direct port of allenk/GeminiWatermarkTool (src/core/watermark_engine.cpp).
 *
 * Repairs edge residuals from lossy compression or post-scaling by diffusing
 * only along high-frequency alpha gradient contours while keeping intact
 * pixels 100% untouched.
 */

import type { Rect, SoftInpaintOptions, WatermarkVariant } from "./types";
import { getAlphaMap } from "./masks";
import {
  createMat,
  dilateEllipse5,
  gaussianBlurMat,
  resizeAuto,
  sobelMagnitude,
  gaussianKernel,
} from "./image-ops";

/**
 * Applies soft gradient-weighted edge inpainting to an image region.
 */
export function inpaintResidual(
  rgba: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  region: Rect,
  options: SoftInpaintOptions,
  variant: WatermarkVariant = "v2",
  padding = 32,
): void {
  const strength = Math.max(0, Math.min(1.0, options.strength));
  const inpaintRadius = Math.max(1, Math.min(25, options.radius));

  if (strength < 0.001 || region.width < 4 || region.height < 4) {
    return;
  }

  // Calculate padded bounding box
  const padX1 = Math.max(0, region.x - padding);
  const padY1 = Math.max(0, region.y - padding);
  const padX2 = Math.min(imageWidth, region.x + region.width + padding);
  const padY2 = Math.min(imageHeight, region.y + region.height + padding);

  const padW = padX2 - padX1;
  const padH = padY2 - padY1;
  if (padW < 8 || padH < 8) return;

  // Inner rect within padded coordinates
  const innerX = region.x - padX1;
  const innerY = region.y - padY1;
  const innerW = Math.min(region.width, padW - innerX);
  const innerH = Math.min(region.height, padH - innerY);

  // 1. Compute alpha gradient to locate sparkle edges
  const sourceAlpha = getAlphaMap("large", variant);
  const alphaResized = resizeAuto(sourceAlpha, region.width, region.height);
  const gradMag = sobelMagnitude(alphaResized);

  let gradMin = Infinity;
  let gradMax = -Infinity;
  const totalGradPx = gradMag.width * gradMag.height;
  for (let i = 0; i < totalGradPx; i++) {
    const v = gradMag.data[i];
    if (v < gradMin) gradMin = v;
    if (v > gradMax) gradMax = v;
  }

  if (gradMax <= gradMin) return;

  // 2. Normalize to [0.0, 1.0] and gamma-correct (sqrt)
  const gradRange = gradMax - gradMin;
  const gradWeight = createMat(gradMag.width, gradMag.height);
  for (let i = 0; i < totalGradPx; i++) {
    const norm = (gradMag.data[i] - gradMin) / gradRange;
    gradWeight.data[i] = Math.sqrt(norm);
  }

  // 3. Dilate with 5x5 ellipse to cover residual spread
  const dilated = dilateEllipse5(gradWeight);

  // 4. Smooth weight for natural transitions (sigma = 2.0)
  const smoothed = gaussianBlurMat(dilated, 2.0);

  // 5. Scale by user strength and clamp to [0.0, 1.0]
  for (let i = 0; i < totalGradPx; i++) {
    smoothed.data[i] = Math.min(1.0, smoothed.data[i] * strength);
  }

  // 6. Embed gradient weight into padded coordinate system
  const paddedWeight = createMat(padW, padH);
  for (let y = 0; y < innerH; y++) {
    for (let x = 0; x < innerW; x++) {
      paddedWeight.data[(innerY + y) * padW + (innerX + x)] =
        smoothed.data[y * smoothed.width + x];
    }
  }

  // 7. Soften boundary transition with tiny blur (sigma = 1.0)
  const boundaryFeather = gaussianBlurMat(paddedWeight, 1.0);

  // 8. Gaussian blur the padded image region
  const ksize = inpaintRadius * 2 + 1;
  const sigma = inpaintRadius * 0.8;
  const kernel = gaussianKernel(ksize, sigma);
  const r = (ksize - 1) / 2;

  // Horizontal blur pass
  const tempBlur = new Float32Array(padW * padH * 3);
  for (let y = 0; y < padH; y++) {
    const srcY = padY1 + y;
    for (let x = 0; x < padW; x++) {
      let rSum = 0, gSum = 0, bSum = 0;
      for (let i = -r; i <= r; i++) {
        let ix = x + i;
        if (ix < 0) ix = -ix;
        if (ix >= padW) ix = 2 * padW - 2 - ix;
        if (ix < 0 || ix >= padW) ix = Math.max(0, Math.min(padW - 1, ix));

        const w = kernel[i + r];
        const p = (srcY * imageWidth + (padX1 + ix)) * 4;
        rSum += rgba[p] * w;
        gSum += rgba[p + 1] * w;
        bSum += rgba[p + 2] * w;
      }
      const outIdx = (y * padW + x) * 3;
      tempBlur[outIdx] = rSum;
      tempBlur[outIdx + 1] = gSum;
      tempBlur[outIdx + 2] = bSum;
    }
  }

  // Vertical blur pass + per-pixel weighted blend back into RGBA buffer
  for (let x = 0; x < padW; x++) {
    const dstX = padX1 + x;
    for (let y = 0; y < padH; y++) {
      const dstY = padY1 + y;
      let rBlur = 0, gBlur = 0, bBlur = 0;
      for (let i = -r; i <= r; i++) {
        let iy = y + i;
        if (iy < 0) iy = -iy;
        if (iy >= padH) iy = 2 * padH - 2 - iy;
        if (iy < 0 || iy >= padH) iy = Math.max(0, Math.min(padH - 1, iy));

        const w = kernel[i + r];
        const inIdx = (iy * padW + x) * 3;
        rBlur += tempBlur[inIdx] * w;
        gBlur += tempBlur[inIdx + 1] * w;
        bBlur += tempBlur[inIdx + 2] * w;
      }

      const wBlend = boundaryFeather.data[y * padW + x];
      if (wBlend < 0.002) continue; // No modification outside residual zone

      const p = (dstY * imageWidth + dstX) * 4;
      const invW = 1.0 - wBlend;

      rgba[p] = Math.round(rgba[p] * invW + rBlur * wBlend);
      rgba[p + 1] = Math.round(rgba[p + 1] * invW + gBlur * wBlend);
      rgba[p + 2] = Math.round(rgba[p + 2] * invW + bBlur * wBlend);
    }
  }
}
