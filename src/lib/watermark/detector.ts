/**
 * Three-Stage Normalized Cross-Correlation (NCC) Watermark Detector.
 *
 * Stage 1: Spatial NCC (Diamond/star structural pattern)
 * Stage 2: Gradient NCC (Sobel edge signature)
 * Stage 3: Statistical Variance Analysis (Texture dampening detection)
 * Ensemble: Position-anchored weighted fusion with spatial rescue
 */

import type { DetectionResult, Rect, WatermarkSize, WatermarkVariant } from "./types";
import { getWatermarkConfig, getWatermarkSize } from "./config";
import { getEffectiveAlphaMap, getAlphaMap } from "./masks";
import {
  grayRegion,
  matchTemplateBest,
  sobelMagnitude,
  meanStdDev,
  subMat,
  resizeAuto,
} from "./image-ops";

/**
 * Detect watermark in an image for a single profile variant.
 */
export function detectOneVariant(
  rgba: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  forceSize?: WatermarkSize | null,
  variant: WatermarkVariant = "v2",
): DetectionResult {
  const result: DetectionResult = {
    detected: false,
    confidence: 0,
    region: { x: 0, y: 0, width: 0, height: 0 },
    size: forceSize ?? getWatermarkSize(imageWidth, imageHeight),
    variant,
    spatialScore: 0,
    gradientScore: 0,
    varianceScore: 0,
  };

  const size = result.size;
  const config = getWatermarkConfig(imageWidth, imageHeight, variant);
  let posX = imageWidth - config.marginRight - config.logoSize;
  let posY = imageHeight - config.marginBottom - config.logoSize;

  const alphaMap = getEffectiveAlphaMap(size, variant, imageWidth, imageHeight);

  // V2 small position derives from canonical aspect ratio heuristics (~1-3px rounding noise).
  // A narrow 3px NCC snap sweep absorbs rounding drift without latching onto background artifacts.
  const needsSnap = variant === "v2" && size === "small";
  const snapPad = needsSnap ? 3 : 0;

  result.region = {
    x: posX,
    y: posY,
    width: alphaMap.width,
    height: alphaMap.height,
  };

  const x1 = Math.max(0, posX - snapPad);
  const y1 = Math.max(0, posY - snapPad);
  const x2 = Math.min(imageWidth, posX + alphaMap.width + snapPad);
  const y2 = Math.min(imageHeight, posY + alphaMap.height + snapPad);

  if (x1 >= x2 || y1 >= y2) {
    return result;
  }

  const roiRect: Rect = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  const { mat: grayF, gray8 } = grayRegion(rgba, imageWidth, roiRect);

  let alphaRegion = alphaMap;
  if (!needsSnap) {
    // Clamp alpha region if it pokes outside image bounds
    alphaRegion = subMat(alphaMap, {
      x: x1 - posX,
      y: y1 - posY,
      width: x2 - x1,
      height: y2 - y1,
    });
  }

  // =========================================================================
  // Stage 1: Spatial Structural Correlation (NCC)
  // =========================================================================
  const spatialMatch = matchTemplateBest(grayF, alphaRegion);
  const spatialScore = spatialMatch.score;
  result.spatialScore = spatialScore;

  // If snap mode is active and correlation is high, refine absolute position
  if (needsSnap && spatialScore >= 0.6) {
    posX = x1 + spatialMatch.x;
    posY = y1 + spatialMatch.y;
    result.region = {
      x: posX,
      y: posY,
      width: alphaMap.width,
      height: alphaMap.height,
    };
  }

  // Circuit Breaker: If spatial correlation is too low, definitely no watermark
  const SPATIAL_THRESHOLD = 0.25;
  if (spatialScore < SPATIAL_THRESHOLD) {
    result.confidence = Math.max(0, spatialScore * 0.5);
    return result;
  }

  // =========================================================================
  // Stage 2: Gradient-Domain Correlation (Edge Signature)
  // =========================================================================
  const imgGMag = sobelMagnitude(grayF);
  const alphaGMag = sobelMagnitude(alphaRegion);
  const gradMatch = matchTemplateBest(imgGMag, alphaGMag);
  const gradScore = gradMatch.score;
  result.gradientScore = gradScore;

  // =========================================================================
  // Stage 3: Statistical Variance Analysis (Texture Dampening)
  // =========================================================================
  let varScore = 0.0;
  const refH = Math.min(y1, config.logoSize);

  if (refH > 8) {
    const refRect: Rect = { x: x1, y: y1 - refH, width: x2 - x1, height: refH };
    const { gray8: grayRef8 } = grayRegion(rgba, imageWidth, refRect);

    const sWm = meanStdDev(gray8).std;
    const sRef = meanStdDev(grayRef8).std;

    if (sRef > 5.0) {
      varScore = Math.max(0, Math.min(1.0, 1.0 - sWm / sRef));
    }
  }
  result.varianceScore = varScore;

  // =========================================================================
  // Heuristic Fusion: Weighted Ensemble
  // =========================================================================
  const fusedConfidence =
    spatialScore * 0.5 + // Spatial correlation is primary
    gradScore * 0.3 + // Edge signature
    varScore * 0.2; // Texture dampening

  let confidence = Math.max(0, Math.min(1.0, fusedConfidence));

  // Position-anchored spatial rescue: on busy backgrounds gradient and variance
  // can collapse while spatial NCC remains distinct. Anchor rescues positives >= 0.30.
  const SPATIAL_RESCUE = 0.3;
  if (spatialScore >= SPATIAL_RESCUE) {
    confidence = Math.max(confidence, spatialScore);
  }

  result.confidence = confidence;
  result.detected = confidence >= 0.25;

  return result;
}

/**
 * Detects watermark with automatic fallback.
 * Checks V2 (Gemini 3.5+) first; if below threshold, tests legacy V1.
 */
export function detectWatermark(
  rgba: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  forceSize?: WatermarkSize | null,
  forceVariant?: WatermarkVariant | null,
  threshold = 0.25,
): { result: DetectionResult; usedLegacyFallback: boolean } {
  if (forceVariant) {
    const res = detectOneVariant(rgba, imageWidth, imageHeight, forceSize, forceVariant);
    res.detected = res.confidence >= threshold;
    return { result: res, usedLegacyFallback: false };
  }

  // Auto mode: Try V2 first
  const v2Result = detectOneVariant(rgba, imageWidth, imageHeight, forceSize, "v2");
  if (v2Result.confidence >= threshold) {
    v2Result.detected = true;
    return { result: v2Result, usedLegacyFallback: false };
  }

  // Fallback to V1
  const v1Result = detectOneVariant(rgba, imageWidth, imageHeight, forceSize, "v1");
  if (v1Result.confidence >= threshold) {
    v1Result.detected = true;
    return { result: v1Result, usedLegacyFallback: true };
  }

  // Neither passed threshold: return higher confidence result
  const best = v2Result.confidence >= v1Result.confidence ? v2Result : v1Result;
  best.detected = false;
  return { result: best, usedLegacyFallback: false };
}

export interface GuidedCandidate {
  x: number;
  y: number;
  scale: number;
  rawScore: number;
  adjustedScore: number;
}

/**
 * Multi-scale guided detection (Snap Engine) within a user-drawn bounding box.
 * Coarse-to-fine NCC search across variable watermark scales.
 */
export function guidedDetect(
  rgba: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  searchRect: Rect,
  minSize = 16,
  maxSize = 160,
  variant: WatermarkVariant = "v2",
): {
  found: boolean;
  confidence: number;
  matchRect: Rect;
  detectedSize: number;
} {
  const x1 = Math.max(0, searchRect.x);
  const y1 = Math.max(0, searchRect.y);
  const x2 = Math.min(imageWidth, searchRect.x + searchRect.width);
  const y2 = Math.min(imageHeight, searchRect.y + searchRect.height);

  const emptyResult = {
    found: false,
    confidence: 0,
    matchRect: { x: 0, y: 0, width: 0, height: 0 },
    detectedSize: 0,
  };

  if (x2 - x1 < 8 || y2 - y1 < 8) return emptyResult;

  const boundedSearch: Rect = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  const { mat: searchGrayF } = grayRegion(rgba, imageWidth, boundedSearch);

  const clampedMin = Math.max(16, minSize);
  const clampedMax = Math.min(maxSize, Math.min(boundedSearch.width, boundedSearch.height));
  if (clampedMin > clampedMax) return emptyResult;

  const REFERENCE_SIZE = 96.0;
  const sizeAdjustedScore = (rawNcc: number, scale: number) => {
    const weight = Math.min(1.0, Math.cbrt(scale / REFERENCE_SIZE));
    return rawNcc * weight;
  };

  const largeSource = getAlphaMap("large", variant);

  // Phase 1: Coarse search
  const coarseStep = 4;
  const coarseScales: number[] = [];
  for (let s = clampedMin; s <= clampedMax; s += coarseStep) {
    coarseScales.push(s);
  }
  for (const std of [36, 48, 96]) {
    if (std >= clampedMin && std <= clampedMax && !coarseScales.some((s) => Math.abs(s - std) <= 2)) {
      coarseScales.push(std);
    }
  }
  coarseScales.sort((a, b) => a - b);

  const coarseCandidates: GuidedCandidate[] = [];

  for (const scale of coarseScales) {
    if (scale > searchGrayF.width || scale > searchGrayF.height) continue;

    const tmpl = resizeAuto(largeSource, scale, scale);
    const match = matchTemplateBest(searchGrayF, tmpl);
    const adj = sizeAdjustedScore(match.score, scale);

    if (adj > 0.08) {
      coarseCandidates.push({
        x: match.x,
        y: match.y,
        scale,
        rawScore: match.score,
        adjustedScore: adj,
      });
      coarseCandidates.sort((a, b) => b.adjustedScore - a.adjustedScore);
      if (coarseCandidates.length > 5) coarseCandidates.pop();
    }
  }

  if (coarseCandidates.length === 0) return emptyResult;

  // Phase 2: Fine refinement (+/- 10px around top candidates)
  let best: GuidedCandidate = { x: 0, y: 0, scale: 0, rawScore: -1, adjustedScore: -1 };

  for (const candidate of coarseCandidates) {
    const lo = Math.max(clampedMin, candidate.scale - 10);
    const hi = Math.min(clampedMax, candidate.scale + 10);

    for (let s = lo; s <= hi; s += 2) {
      if (s > searchGrayF.width || s > searchGrayF.height) continue;

      const tmpl = resizeAuto(largeSource, s, s);
      const match = matchTemplateBest(searchGrayF, tmpl);
      const adj = sizeAdjustedScore(match.score, s);

      if (adj > best.adjustedScore) {
        best = { x: match.x, y: match.y, scale: s, rawScore: match.score, adjustedScore: adj };
      }
    }
  }

  if (best.adjustedScore > 0.08) {
    return {
      found: true,
      confidence: best.adjustedScore,
      matchRect: {
        x: boundedSearch.x + best.x,
        y: boundedSearch.y + best.y,
        width: best.scale,
        height: best.scale,
      },
      detectedSize: best.scale,
    };
  }

  return emptyResult;
}
