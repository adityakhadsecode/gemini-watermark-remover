/**
 * Alpha mask cache & loader.
 * Decodes base64-encoded maxChannel values into FloatMat [0.0, 1.0]
 * and provides resolution-aware dynamic interpolation.
 */

import { MASK_SOURCES } from "./masks.generated";
import type { FloatMat, WatermarkSize, WatermarkVariant } from "./types";
import { createMat, resizeAuto } from "./image-ops";
import { getWatermarkConfig } from "./config";

function decodeBase64ToFloatMat(b64: string, size: number): FloatMat {
  // Decode base64 in browser or Node.js
  let binary: string;
  if (typeof atob === "function") {
    binary = atob(b64);
  } else {
    binary = Buffer.from(b64, "base64").toString("binary");
  }

  const mat = createMat(size, size);
  const n = size * size;
  for (let i = 0; i < n; i++) {
    mat.data[i] = binary.charCodeAt(i) / 255.0;
  }
  return mat;
}

// Pre-decoded static canonical masks
const V1_SMALL = decodeBase64ToFloatMat(MASK_SOURCES.V1_SMALL.b64, MASK_SOURCES.V1_SMALL.size);
const V1_LARGE = decodeBase64ToFloatMat(MASK_SOURCES.V1_LARGE.b64, MASK_SOURCES.V1_LARGE.size);
const V2_SMALL = decodeBase64ToFloatMat(MASK_SOURCES.V2_SMALL.b64, MASK_SOURCES.V2_SMALL.size);
const V2_LARGE = decodeBase64ToFloatMat(MASK_SOURCES.V2_LARGE.b64, MASK_SOURCES.V2_LARGE.size);

// Cache for dynamic interpolated custom sizes (e.g. free-tier 48px V2, or manual regions)
const interpolationCache = new Map<string, FloatMat>();

/**
 * Returns the canonical alpha map for a given size class and profile variant.
 */
export function getAlphaMap(size: WatermarkSize, variant: WatermarkVariant): FloatMat {
  if (variant === "v2") {
    return size === "small" ? V2_SMALL : V2_LARGE;
  }
  return size === "small" ? V1_SMALL : V1_LARGE;
}

/**
 * Creates or retrieves a cached interpolated alpha map for arbitrary target dimensions.
 * Always resizes from the large 96x96 canonical source for optimal fidelity.
 */
export function createInterpolatedAlpha(
  targetWidth: number,
  targetHeight: number,
  variant: WatermarkVariant,
): FloatMat {
  const source = getAlphaMap("large", variant);
  if (targetWidth === source.width && targetHeight === source.height) {
    return source;
  }

  const cacheKey = `${variant}_${targetWidth}x${targetHeight}`;
  const cached = interpolationCache.get(cacheKey);
  if (cached) return cached;

  const interpolated = resizeAuto(source, targetWidth, targetHeight);
  interpolationCache.set(cacheKey, interpolated);
  return interpolated;
}

/**
 * Resolves the effective alpha map for an image.
 * For V2 small, 1024-class images use the canonical 36x36 mask, whereas
 * larger small outputs (such as free-tier 1376x768) scale the logo proportionally
 * to config.logoSize (e.g. 48px), so we interpolate from the 96px source.
 */
export function getEffectiveAlphaMap(
  size: WatermarkSize,
  variant: WatermarkVariant,
  imageWidth: number,
  imageHeight: number,
): FloatMat {
  const base = getAlphaMap(size, variant);

  if (size === "small" && variant === "v2") {
    const config = getWatermarkConfig(imageWidth, imageHeight, variant);
    if (config.logoSize !== base.width) {
      return createInterpolatedAlpha(config.logoSize, config.logoSize, variant);
    }
  }

  return base;
}
