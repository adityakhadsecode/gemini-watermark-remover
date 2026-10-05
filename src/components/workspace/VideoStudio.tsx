"use client";

import React, { useState, useRef } from "react";
import {
  Download,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MediaDropzone } from "./MediaDropzone";
import { VideoTuner } from "./VideoTuner";
import { grabPreviewFrame, getSparkleImage, processVeoVideo } from "@/lib/video/engine";
import { getVeoWatermark, VIDEO_DEFAULTS } from "@/lib/video/config";
import type {
  VideoProcessResult,
  VideoProgress,
  VideoTunerSettings,
  VideoWatermarkBox,
} from "@/lib/video/types";

export function VideoStudio() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VideoProcessResult | null>(null);
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tuner & preview frame state
  const [previewFrame, setPreviewFrame] = useState<{
    width: number;
    height: number;
    imageData: ImageData;
  } | null>(null);
  const [sparkleImg, setSparkleImg] = useState<HTMLImageElement | null>(null);
  const [baseBox, setBaseBox] = useState<VideoWatermarkBox | null>(null);
  const [settings, setSettings] = useState<VideoTunerSettings>({ ...VIDEO_DEFAULTS });

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setVideoFile(file);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(URL.createObjectURL(file));
    setResult(null);
    setProgress(null);
    setError(null);
    setIsLoadingPreview(true);

    try {
      const [f, bg] = await Promise.all([
        grabPreviewFrame(file),
        getSparkleImage(),
      ]);
      setPreviewFrame(f);
      setSparkleImg(bg);
      setBaseBox(getVeoWatermark(f.width, f.height));
    } catch (err) {
      console.error("Failed to load video preview frame:", err);
      setError("Could not extract preview frame from video.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const startProcessing = async () => {
    if (!videoFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await processVeoVideo(
        videoFile,
        { settings },
        (p) => {
          setProgress(p);
        },
      );
      setResult(res);
    } catch (err: unknown) {
      console.error("Video processing error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to process video: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const downloadCleanVideo = () => {
    if (!result?.cleanedUrl || !videoFile) return;
    const a = document.createElement("a");
    a.href = result.cleanedUrl;
    const baseName = videoFile.name.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}-veo-clean.mp4`;
    a.click();
  };

  const resetAll = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.cleanedUrl) URL.revokeObjectURL(result.cleanedUrl);
    setVideoFile(null);
    setOriginalUrl(null);
    setResult(null);
    setProgress(null);
    setError(null);
    setPreviewFrame(null);
    setSparkleImg(null);
    setBaseBox(null);
    setSettings({ ...VIDEO_DEFAULTS });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-6 px-4">
      {!videoFile ? (
        <MediaDropzone mode="video" onFilesSelected={handleFilesSelected} disabled={isProcessing} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top Actions & Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-xs border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                Veo Video
              </Badge>
              <span className="font-mono text-xs text-foreground truncate max-w-xs">{videoFile.name}</span>
              {previewFrame && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {previewFrame.width}×{previewFrame.height}
                </span>
              )}
              {result && (
                <Badge variant="outline" className="font-mono text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  {result.totalFrames} frames cleaned
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
                disabled={isProcessing}
                className="text-xs h-8"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Change Video
              </Button>

              {!result && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={startProcessing}
                  disabled={isProcessing || isLoadingPreview}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-8 shadow-sm"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>{isProcessing ? "Processing Video..." : "Remove & Export Clean MP4"}</span>
                </Button>
              )}

              {result && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={downloadCleanVideo}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-8 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Clean MP4</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress / Status banner during processing */}
          {isProcessing && progress && (
            <div className="flex flex-col gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.05] p-4 text-xs font-mono">
              <div className="flex items-center justify-between text-indigo-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {progress.message}
                </span>
                <span>{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} className="h-2 bg-muted/40" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
              <ShieldAlert className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Live Tuner (shown before video processing is completed) */}
          {!result && (
            <div className="flex flex-col gap-4">
              {isLoadingPreview ? (
                <div className="flex h-56 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-card">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                    <span>Extracting preview frame...</span>
                  </div>
                </div>
              ) : (
                <VideoTuner
                  frame={previewFrame}
                  sparkleImg={sparkleImg}
                  base={baseBox}
                  settings={settings}
                  onChange={setSettings}
                />
              )}
            </div>
          )}

          {/* Result Video Player Display */}
          {result && (
            <div className="flex flex-col gap-4">
              <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-card overflow-hidden shadow-2xl">
                <div className="relative flex h-[500px] w-full items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    src={showOriginal ? originalUrl! : result.cleanedUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="max-h-full max-w-full object-contain"
                    playsInline
                    controls={false}
                  />

                  {/* Overlay Label */}
                  <div className="absolute top-4 left-4 rounded bg-black/70 px-2.5 py-1 font-mono text-[11px] text-white/90 border border-white/10 backdrop-blur-sm">
                    {showOriginal ? "ORIGINAL (WATERMARKED)" : "CLEANED (WATERMARK REMOVED)"}
                  </div>
                </div>

                {/* Video Controls Bar */}
                <div className="flex flex-col gap-2 border-t border-white/[0.08] bg-muted/20 p-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={togglePlay}
                      className="text-foreground"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>

                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.01}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 accent-indigo-500 cursor-pointer bg-muted/40 rounded"
                    />

                    <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                    </span>

                    <Button
                      variant={showOriginal ? "default" : "outline"}
                      size="xs"
                      onClick={() => setShowOriginal((v) => !v)}
                      className="text-[11px] h-6 whitespace-nowrap"
                    >
                      {showOriginal ? "Viewing Original" : "Compare Original"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Adjust & Re-run CTA */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-card p-4">
                <div>
                  <span className="text-xs font-semibold text-foreground">Need to fine-tune the alignment?</span>
                  <p className="text-[11px] text-muted-foreground">Re-open the tuner sliders to nudge position or strength and re-export.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResult(null)}
                  className="text-xs gap-1.5 h-8"
                >
                  <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Adjust & Re-export</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
