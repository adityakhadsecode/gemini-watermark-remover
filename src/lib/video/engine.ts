/**
 * Client-Side Video Restoration Engine via hardware WebCodecs (mediabunny).
 * Ported from E:\Coding\bhushan\gemini-watermark-remover.
 * Delivers hardware-accelerated H.264 encoding/decoding, native audio passthrough,
 * and precise ROI reverse alpha blending without virtual filesystem overhead.
 */

import type { VideoProcessingOptions, VideoProcessResult, VideoProgress, VideoTunerSettings } from "./types";
import { getVeoWatermark, resolveBox, getRoi, buildAlpha, removeWatermark, VIDEO_DEFAULTS } from "./config";
import { getAssetPath } from "@/lib/utils/asset-path";

let bgSparkle: HTMLImageElement | null = null;

/**
 * Loads the reference sparkle watermark template image (/assets/bg_96.png).
 */
export async function getSparkleImage(): Promise<HTMLImageElement> {
  if (bgSparkle) return bgSparkle;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      bgSparkle = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error("Failed to load /assets/bg_96.png watermark template"));
    img.src = getAssetPath("/assets/bg_96.png");
  });
}

/**
 * Grabs a representative frame using standard HTML5 <video> without WebCodecs.
 * Used for instant, zero-latency live preview and tuner adjustments.
 */
export function grabPreviewFrame(file: File): Promise<{ width: number; height: number; imageData: ImageData }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = url;

    const cleanup = () => URL.revokeObjectURL(url);
    v.onerror = () => {
      cleanup();
      reject(new Error("Could not read this video file."));
    };
    v.onloadedmetadata = () => {
      const seekTo = Math.min(Math.max((v.duration || 1) * 0.3, 0.1), (v.duration || 1) - 0.05 || 0.1);
      const onSeeked = () => {
        try {
          const w = v.videoWidth;
          const h = v.videoHeight;
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const cx = c.getContext("2d", { willReadFrequently: true });
          if (!cx) throw new Error("Could not create 2D canvas context");
          cx.drawImage(v, 0, 0, w, h);
          const imageData = cx.getImageData(0, 0, w, h);
          cleanup();
          resolve({ width: w, height: h, imageData });
        } catch (err) {
          cleanup();
          reject(err);
        }
      };
      v.onseeked = onSeeked;
      try {
        v.currentTime = seekTo;
      } catch {
        onSeeked();
      }
    };
  });
}

/**
 * Processes an input Veo video file entirely within the browser using mediabunny.
 */
export async function processVeoVideo(
  videoFile: File,
  options: VideoProcessingOptions = {},
  onProgress?: (p: VideoProgress) => void,
): Promise<VideoProcessResult> {
  const startTime = performance.now();
  const settings: VideoTunerSettings = options.settings || VIDEO_DEFAULTS;

  onProgress?.({
    stage: "loading",
    currentFrame: 0,
    totalFrames: 0,
    percent: 5,
    message: "Initializing hardware video engine...",
  });

  const sparkleImg = await getSparkleImage();

  // Dynamically import mediabunny
  const mb = await import("mediabunny");
  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    CanvasSource,
    EncodedAudioPacketSource,
    EncodedPacketSink,
    Input,
    Mp4OutputFormat,
    Output,
    QUALITY_HIGH,
    VideoSampleSink,
    canEncodeVideo,
  } = mb;

  if (canEncodeVideo && !(await canEncodeVideo("avc"))) {
    throw new Error(
      "Your browser cannot encode H.264 video locally. Please try the latest Chrome, Edge, or a WebCodecs-compatible browser."
    );
  }

  const originalUrl = URL.createObjectURL(videoFile);
  const input = new Input({ source: new BlobSource(videoFile), formats: ALL_FORMATS });

  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) {
    input.dispose?.();
    URL.revokeObjectURL(originalUrl);
    throw new Error("No decodable video track was found in this file.");
  }

  const width = videoTrack.displayWidth ?? videoTrack.codedWidth;
  const height = videoTrack.displayHeight ?? videoTrack.codedHeight;
  const duration = await input.computeDuration().catch(() => 0);

  let frameRate = 30;
  try {
    const stats = await videoTrack.computePacketStats(120);
    if (stats?.averagePacketRate) frameRate = Math.round(stats.averagePacketRate);
  } catch {
    // Keep 30 fps default
  }

  const base = getVeoWatermark(width, height);
  const wm = resolveBox(base, width, height, settings);
  const roi = getRoi(width, height, wm);
  const alpha = buildAlpha(sparkleImg, roi, wm, settings.gain);
  const region = { x: 0, y: 0, width: roi.width, height: roi.height };

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat(), target });
  const videoSource = new CanvasSource(canvas as HTMLCanvasElement, {
    codec: "avc",
    bitrate: QUALITY_HIGH,
    keyFrameInterval: 2,
    sizeChangeBehavior: "passThrough",
  });
  output.addVideoTrack(videoSource, { frameRate });

  // Audio passthrough (best-effort lossless)
  let audioSource: any = null;
  let audioTrack: any = null;
  let audioDecoderConfig: any = null;
  try {
    audioTrack = await input.getPrimaryAudioTrack();
    if (audioTrack) {
      const audioCodec = await audioTrack.getCodec();
      audioDecoderConfig = await audioTrack.getDecoderConfig().catch(() => null);
      if (audioCodec && audioDecoderConfig) {
        audioSource = new EncodedAudioPacketSource(audioCodec);
        output.addAudioTrack(audioSource);
      }
    }
  } catch {
    audioSource = null;
  }

  await output.start();

  const fallbackDur = frameRate > 0 ? 1 / frameRate : 1 / 30;
  const sink = new VideoSampleSink(videoTrack);
  let firstTimestamp: number | null = null;
  let lastTimestamp = -1;
  let frameCount = 0;

  for await (const sample of sink.samples()) {
    if (firstTimestamp === null) firstTimestamp = sample.timestamp;
    let timestamp = sample.timestamp - firstTimestamp;
    if (!(timestamp >= 0)) timestamp = 0;
    if (timestamp <= lastTimestamp) timestamp = lastTimestamp + fallbackDur;
    const dur =
      Number.isFinite(sample.duration) && sample.duration > 0
        ? sample.duration
        : fallbackDur;
    lastTimestamp = timestamp;

    sample.draw(ctx as any, 0, 0, width, height);
    sample.close();

    const px = ctx.getImageData(roi.x, roi.y, roi.width, roi.height);
    removeWatermark(px, alpha, region);
    ctx.putImageData(px, roi.x, roi.y);

    await videoSource.add(timestamp, dur);
    frameCount++;

    if (duration > 0) {
      const progressFraction = Math.min(0.95, timestamp / duration);
      onProgress?.({
        stage: "processing_frames",
        currentFrame: frameCount,
        totalFrames: Math.round(duration * frameRate),
        percent: Math.round(progressFraction * 100),
        message: `Inverting watermark (${Math.round(progressFraction * 100)}%)...`,
        fps: frameRate,
      });
    }
  }
  videoSource.close();

  if (audioSource) {
    try {
      const offset = firstTimestamp ?? 0;
      const aSink = new EncodedPacketSink(audioTrack);
      let isFirstAudio = true;
      let lastAudioTs = -1;
      for await (const packet of aSink.packets()) {
        let newTs = packet.timestamp - offset;
        if (newTs < 0) continue;
        if (newTs <= lastAudioTs) newTs = lastAudioTs + 1e-6;
        lastAudioTs = newTs;
        let outPacket = packet;
        if (newTs !== packet.timestamp && typeof packet.clone === "function") {
          outPacket = packet.clone({ timestamp: newTs });
        }
        await audioSource.add(
          outPacket,
          isFirstAudio && audioDecoderConfig ? { decoderConfig: audioDecoderConfig } : undefined,
        );
        isFirstAudio = false;
      }
    } catch (e) {
      console.warn("Audio passthrough failed; exporting video only.", e);
    } finally {
      audioSource.close();
    }
  }

  await output.finalize();
  input.dispose?.();

  if (!target.buffer) {
    URL.revokeObjectURL(originalUrl);
    throw new Error("Video export produced no output.");
  }

  const cleanedBlob = new Blob([target.buffer], { type: "video/mp4" });
  const cleanedUrl = URL.createObjectURL(cleanedBlob);
  const elapsedMs = performance.now() - startTime;

  onProgress?.({
    stage: "complete",
    currentFrame: frameCount,
    totalFrames: frameCount,
    percent: 100,
    message: "Restoration complete!",
  });

  return {
    cleanedBlob,
    cleanedUrl,
    originalUrl,
    durationSeconds: duration,
    totalFrames: frameCount,
    width,
    height,
    region: { x: wm.x, y: wm.y, width: wm.width, height: wm.height },
    elapsedMs,
  };
}
