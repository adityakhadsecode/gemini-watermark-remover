/**
 * Core domain types for the image watermark engine.
 * Ported from allenk/GeminiWatermarkTool src/core/watermark_engine.hpp.
 */

/** Single-channel float matrix (equivalent of cv::Mat CV_32FC1). */
export interface FloatMat {
  width: number;
  height: number;
  data: Float32Array;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Small/Large canonical size class, chosen from image dimensions. */
export type WatermarkSize = "small" | "large";

/**
 * V1 = legacy profile (Gemini before 3.5).
 * V2 = current profile (Gemini 3.5 onward).
 */
export type WatermarkVariant = "v1" | "v2";

export interface WatermarkPosition {
  marginRight: number;
  marginBottom: number;
  logoSize: number;
}

export interface DetectionResult {
  detected: boolean;
  /** Fused confidence 0..1 */
  confidence: number;
  region: Rect;
  size: WatermarkSize;
  variant: WatermarkVariant;
  spatialScore: number;
  gradientScore: number;
  varianceScore: number;
}

/** Profile selection exposed in the UI. "auto" = V2 first, V1 fallback. */
export type ProfileMode = "auto" | WatermarkVariant;

export interface SoftInpaintOptions {
  /** 0..1 blend strength (C++ default 0.85) */
  strength: number;
  /** Gaussian radius in px (C++ default 10) */
  radius: number;
}

export interface ProcessOptions {
  profile: ProfileMode;
  /** Detection confidence gate (CLI default 0.25) */
  threshold: number;
  /** Process even when detection falls below threshold */
  force: boolean;
  /** User-specified region; bypasses automatic placement */
  customRegion?: Rect | null;
  /** Optional residual cleanup; null = disabled (C++ default) */
  softInpaint?: SoftInpaintOptions | null;
}

export type ProcessStatus = "removed" | "skipped";

export interface ProcessResult {
  status: ProcessStatus;
  /** Detection that drove the decision (null for custom-region mode) */
  detection: DetectionResult | null;
  /** Region that was actually modified */
  region: Rect | null;
  variant: WatermarkVariant | null;
  /** True when V2 skipped and V1 succeeded */
  usedLegacyFallback: boolean;
  elapsedMs: number;
  message: string;
}

export const DEFAULT_PROCESS_OPTIONS: ProcessOptions = {
  profile: "auto",
  threshold: 0.25,
  force: false,
  customRegion: null,
  softInpaint: null,
};
