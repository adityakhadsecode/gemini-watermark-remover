/**
 * Watermark position & geometry configuration.
 */

import type { Rect, WatermarkPosition, WatermarkSize, WatermarkVariant } from "./types";

/**
 * Determine watermark canonical size classification from image dimensions.
 * Large only when BOTH dimensions are strictly greater than 1024.
 * 1024x1024 is classified as Small.
 */
export function getWatermarkSize(width: number, height: number): WatermarkSize {
  return width > 1024 && height > 1024 ? "large" : "small";
}

/**
 * Resolves V2 small position by inferring the canonical large source the image
 * was downscaled from. Small Gemini outputs are 1024-class on the long side and
 * inherit per-axis rounding from the source aspect ratio.
 *
 * Half-scale outputs (e.g. free-tier 1376/1408/1424-class, issue #40) identify
 * their canonical directly: twice the long side lands on 2752/2816/2848.
 */
function v2SmallConfigFromDims(width: number, height: number): WatermarkPosition {
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);

  let sourceLongDim: number;
  if (longSide > 1100) {
    const doubled = 2.0 * longSide;
    sourceLongDim = 2752.0;
    for (const cand of [2816.0, 2848.0]) {
      if (Math.abs(doubled - cand) < Math.abs(doubled - sourceLongDim)) {
        sourceLongDim = cand;
      }
    }
  } else if (shortSide >= 566) {
    sourceLongDim = 2752.0;
  } else if (shortSide >= 550) {
    sourceLongDim = 2816.0;
  } else {
    sourceLongDim = 2848.0;
  }

  const scale = longSide / sourceLongDim;
  const margin = Math.round(192.0 * scale);
  const ideal = Math.round(96.0 * scale);

  return {
    marginRight: margin,
    marginBottom: margin,
    logoSize: ideal <= 40 ? 36 : ideal,
  };
}

/**
 * Get the watermark geometry config for a given image resolution and profile.
 */
export function getWatermarkConfig(
  width: number,
  height: number,
  variant: WatermarkVariant,
): WatermarkPosition {
  const isLarge = width > 1024 && height > 1024;

  if (variant === "v1") {
    if (isLarge) {
      return { marginRight: 64, marginBottom: 64, logoSize: 96 };
    }
    return { marginRight: 32, marginBottom: 32, logoSize: 48 };
  }

  // Variant V2 (Gemini 3.5+)
  if (isLarge) {
    return { marginRight: 192, marginBottom: 192, logoSize: 96 };
  }

  return v2SmallConfigFromDims(width, height);
}

/**
 * Calculate the top-left bounding box rect for the watermark on an image.
 */
export function getWatermarkRect(
  imageWidth: number,
  imageHeight: number,
  config: WatermarkPosition,
): Rect {
  return {
    x: imageWidth - config.marginRight - config.logoSize,
    y: imageHeight - config.marginBottom - config.logoSize,
    width: config.logoSize,
    height: config.logoSize,
  };
}
