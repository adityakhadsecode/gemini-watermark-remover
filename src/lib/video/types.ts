/**
 * Video processing domain types.
 * Derived from Veo watermark dynamics and Bhushan's tuner specifications.
 */

import type { Rect } from "../watermark/types";

export type VeoVariant =
  | "veo"
  | "corner"
  | "1080p"
  | "720p_std"
  | "custom";

export interface VideoWatermarkBox {
  size: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoTunerSettings {
  gain: number;
  offsetX: number;
  offsetY: number;
  sizeScale: number;
}

export interface VideoWatermarkConfig {
  variant: VeoVariant;
  rect: Rect;
  logoSize: number;
  marginRight: number;
  marginBottom: number;
  defaultAlpha: number;
}

export interface VideoProgress {
  stage: "loading" | "preview" | "analyzing" | "processing_frames" | "muxing" | "complete" | "error";
  currentFrame: number;
  totalFrames: number;
  percent: number;
  message: string;
  fps?: number;
}

export interface VideoProcessingOptions {
  settings?: VideoTunerSettings;
  presetId?: "veo" | "corner" | "custom";
  onProgress?: (p: VideoProgress) => void;
}

export interface VideoProcessResult {
  cleanedBlob: Blob;
  cleanedUrl: string;
  originalUrl: string;
  durationSeconds: number;
  totalFrames: number;
  width: number;
  height: number;
  region: Rect;
  elapsedMs: number;
}
