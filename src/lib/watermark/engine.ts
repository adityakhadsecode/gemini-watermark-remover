/**
 * High-level Watermark Engine.
 * Coordinates detection, reverse alpha blending, custom region override,
 * and optional soft inpainting.
 */

import type { ProcessOptions, ProcessResult, Rect, WatermarkVariant } from "./types";
import { DEFAULT_PROCESS_OPTIONS } from "./types";
import { getWatermarkSize } from "./config";
import { createInterpolatedAlpha, getAlphaMap, getEffectiveAlphaMap } from "./masks";
import { detectWatermark } from "./detector";
import { removeWatermarkAlphaBlend } from "./blender";
import { inpaintResidual } from "./inpaint";

/**
 * Processes an RGBA pixel buffer in-place to detect and remove Gemini watermarks.
 *
 * @param rgba - Uint8ClampedArray pixel buffer
 * @param width - Image width
 * @param height - Image height
 * @param options - Processing options (profile, threshold, force, customRegion, softInpaint)
 */
export function processImage(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  options: Partial<ProcessOptions> = {},
): ProcessResult {
  const startTime = performance.now();
  const opts: ProcessOptions = { ...DEFAULT_PROCESS_OPTIONS, ...options };

  // Case 1: Custom region specified by user
  if (opts.customRegion && opts.customRegion.width > 4 && opts.customRegion.height > 4) {
    const reg: Rect = {
      x: Math.round(opts.customRegion.x),
      y: Math.round(opts.customRegion.y),
      width: Math.round(opts.customRegion.width),
      height: Math.round(opts.customRegion.height),
    };

    const variant: WatermarkVariant = opts.profile === "v1" ? "v1" : "v2";
    let alphaMap = createInterpolatedAlpha(reg.width, reg.height, variant);

    // Canonical fast paths
    if (reg.width === 36 && reg.height === 36 && variant === "v2") {
      alphaMap = getAlphaMap("small", "v2");
    } else if (reg.width === 48 && reg.height === 48 && variant === "v1") {
      alphaMap = getAlphaMap("small", "v1");
    } else if (reg.width === 96 && reg.height === 96) {
      alphaMap = getAlphaMap("large", variant);
    }

    const appliedRect = removeWatermarkAlphaBlend(
      rgba,
      width,
      height,
      alphaMap,
      { x: reg.x, y: reg.y },
    );

    if (opts.softInpaint && opts.softInpaint.strength > 0) {
      inpaintResidual(rgba, width, height, appliedRect, opts.softInpaint, variant);
    }

    const elapsedMs = performance.now() - startTime;
    return {
      status: "removed",
      detection: null,
      region: appliedRect,
      variant,
      usedLegacyFallback: false,
      elapsedMs,
      message: `Custom region ${reg.width}x${reg.height} restored`,
    };
  }

  // Case 2: Automatic or pinned profile detection
  const forcedVariant: WatermarkVariant | null =
    opts.profile === "auto" ? null : opts.profile;

  const { result: det, usedLegacyFallback } = detectWatermark(
    rgba,
    width,
    height,
    null,
    forcedVariant,
    opts.threshold,
  );

  const shouldProcess = det.confidence >= opts.threshold || opts.force;

  if (!shouldProcess) {
    const elapsedMs = performance.now() - startTime;
    return {
      status: "skipped",
      detection: det,
      region: null,
      variant: det.variant,
      usedLegacyFallback,
      elapsedMs,
      message: `No watermark detected (${(det.confidence * 100).toFixed(0)}% confidence, threshold: ${(opts.threshold * 100).toFixed(0)}%)`,
    };
  }

  // Apply removal at detected region
  const size = det.size;
  const variant = det.variant;
  const alphaMap = getEffectiveAlphaMap(size, variant, width, height);

  const appliedRect = removeWatermarkAlphaBlend(
    rgba,
    width,
    height,
    alphaMap,
    { x: det.region.x, y: det.region.y },
  );

  if (opts.softInpaint && opts.softInpaint.strength > 0) {
    inpaintResidual(rgba, width, height, appliedRect, opts.softInpaint, variant);
  }

  const elapsedMs = performance.now() - startTime;
  return {
    status: "removed",
    detection: det,
    region: appliedRect,
    variant,
    usedLegacyFallback,
    elapsedMs,
    message: `Watermark removed (${variant.toUpperCase()}, ${(det.confidence * 100).toFixed(0)}% conf)`,
  };
}

/**
 * Convenience wrapper for HTML5 ImageData objects.
 */
export function processImageData(
  imageData: ImageData,
  options?: Partial<ProcessOptions>,
): ProcessResult {
  return processImage(imageData.data, imageData.width, imageData.height, options);
}
