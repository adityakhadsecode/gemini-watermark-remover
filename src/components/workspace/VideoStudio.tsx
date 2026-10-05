"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { VideoBatchDrawer, type VideoBatchItem } from "./VideoBatchDrawer";
import { grabPreviewFrame, getSparkleImage, processVeoVideo } from "@/lib/video/engine";
import { getVeoWatermark, VIDEO_DEFAULTS } from "@/lib/video/config";
import type {
  VideoProcessResult,
  VideoProgress,
  VideoTunerSettings,
  VideoWatermarkBox,
} from "@/lib/video/types";

export function VideoStudio() {
  const [items, setItems] = useState<VideoBatchItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState<VideoProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tuner & preview frame state (associated with activeId)
  const [activeFrame, setActiveFrame] = useState<{
    width: number;
    height: number;
    imageData: ImageData;
  } | null>(null);
  const [sparkleImg, setSparkleImg] = useState<HTMLImageElement | null>(null);
  const [baseBox, setBaseBox] = useState<VideoWatermarkBox | null>(null);
  const [settings, setSettings] = useState<VideoTunerSettings>({ ...VIDEO_DEFAULTS });

  // Player state for active item
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const activeItem = items.find((i) => i.id === activeId) || items[0] || null;

  // Helper to load preview frame for a video item
  const loadPreviewForItem = useCallback(
    async (file: File) => {
      try {
        const [f, bg] = await Promise.all([grabPreviewFrame(file), getSparkleImage()]);
        setActiveFrame(f);
        setSparkleImg(bg);
        setBaseBox(getVeoWatermark(f.width, f.height));

        // Create small thumbnail for list
        const thumbCanvas = document.createElement("canvas");
        const thumbScale = Math.min(1, 160 / f.width);
        thumbCanvas.width = Math.round(f.width * thumbScale);
        thumbCanvas.height = Math.round(f.height * thumbScale);
        const tctx = thumbCanvas.getContext("2d");
        if (tctx) {
          const off = document.createElement("canvas");
          off.width = f.width;
          off.height = f.height;
          off.getContext("2d")?.putImageData(f.imageData, 0, 0);
          tctx.drawImage(off, 0, 0, thumbCanvas.width, thumbCanvas.height);
          return { frame: f, thumbUrl: thumbCanvas.toDataURL("image/jpeg", 0.7) };
        }
        return { frame: f, thumbUrl: null };
      } catch (err) {
        console.error("Failed to extract preview frame:", err);
        return { frame: null, thumbUrl: null };
      }
    },
    [],
  );

  // Handle files selected or dropped
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);

    const newItems: VideoBatchItem[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      name: file.name,
      file,
      originalUrl: URL.createObjectURL(file),
      cleanedUrl: null,
      cleanedBlob: null,
      status: "pending",
      progressPercent: 0,
      previewThumbnailUrl: null,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Set first newly added item as active if none is active
    const firstNew = newItems[0];
    if (!activeId) {
      setActiveId(firstNew.id);
    }

    // Load preview frame for the active item
    const previewTarget = !activeId ? firstNew : items.find((i) => i.id === activeId) || firstNew;
    const { frame, thumbUrl } = await loadPreviewForItem(previewTarget.file);

    if (thumbUrl) {
      setItems((prev) =>
        prev.map((i) => (i.id === previewTarget.id ? { ...i, previewThumbnailUrl: thumbUrl, width: frame?.width, height: frame?.height } : i)),
      );
    }

    // Generate thumbnails in background for other files
    for (const item of newItems) {
      if (item.id !== previewTarget.id) {
        loadPreviewForItem(item.file).then(({ frame: f, thumbUrl: t }) => {
          if (t) {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, previewThumbnailUrl: t, width: f?.width, height: f?.height } : i)),
            );
          }
        });
      }
    }
  };

  // Switch active item for tuning / preview
  const handleSelectActive = async (id: string) => {
    setActiveId(id);
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const { frame } = await loadPreviewForItem(item.file);
    if (frame) {
      setBaseBox(getVeoWatermark(frame.width, frame.height));
    }
  };

  // Process all queued pending videos sequentially
  const handleProcessAll = async () => {
    if (isProcessing || items.length === 0) return;
    setIsProcessing(true);
    setError(null);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === "completed") continue;

      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "processing", progressPercent: 0 } : it)),
      );

      try {
        const res = await processVeoVideo(item.file, { settings }, (p) => {
          setGlobalProgress(p);
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, progressPercent: p.percent } : it)),
          );
        });

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "completed",
                  cleanedUrl: res.cleanedUrl,
                  cleanedBlob: res.cleanedBlob,
                  progressPercent: 100,
                  durationSeconds: res.durationSeconds,
                  totalFrames: res.totalFrames,
                }
              : it,
          ),
        );
      } catch (err) {
        console.error(`Error processing video ${item.name}:`, err);
        const message = err instanceof Error ? err.message : String(err);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: "error", error: message } : it,
          ),
        );
      }
    }

    setIsProcessing(false);
    setGlobalProgress(null);
  };

  const handleRemoveItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      URL.revokeObjectURL(item.originalUrl);
      if (item.cleanedUrl) URL.revokeObjectURL(item.cleanedUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activeId === id) {
      const remaining = items.filter((i) => i.id !== id);
      if (remaining.length > 0) {
        handleSelectActive(remaining[0].id);
      } else {
        setActiveId(null);
        setActiveFrame(null);
        setBaseBox(null);
      }
    }
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.cleanedUrl) URL.revokeObjectURL(item.cleanedUrl);
    });
    setItems([]);
    setActiveId(null);
    setActiveFrame(null);
    setBaseBox(null);
    setError(null);
    setGlobalProgress(null);
    setSettings({ ...VIDEO_DEFAULTS });
  };

  // Video player controls
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

  const downloadActiveCleanVideo = () => {
    if (!activeItem?.cleanedUrl) return;
    const a = document.createElement("a");
    a.href = activeItem.cleanedUrl;
    const baseName = activeItem.name.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}-veo-clean.mp4`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-6 px-4">
      {items.length === 0 ? (
        <MediaDropzone mode="video" onFilesSelected={handleFilesSelected} disabled={isProcessing} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top Actions & Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-xs border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                Veo Video Batch
              </Badge>
              {activeItem && (
                <span className="font-mono text-xs text-foreground truncate max-w-xs">
                  Active: {activeItem.name}
                </span>
              )}
              {activeFrame && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {activeFrame.width}×{activeFrame.height}
                </span>
              )}
              {activeItem?.status === "completed" && (
                <Badge variant="outline" className="font-mono text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  Cleaned
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={isProcessing}
                className="text-xs h-8"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset All
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleProcessAll}
                disabled={isProcessing || items.every((i) => i.status === "completed")}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-8 shadow-sm"
              >
                {isProcessing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{isProcessing ? "Processing Queue..." : "Process All Videos"}</span>
              </Button>

              {activeItem?.cleanedUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadActiveCleanVideo}
                  className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5 h-8"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Active MP4</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress / Status banner during processing */}
          {isProcessing && globalProgress && (
            <div className="flex flex-col gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.05] p-4 text-xs font-mono">
              <div className="flex items-center justify-between text-indigo-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {globalProgress.message}
                </span>
                <span>{globalProgress.percent}%</span>
              </div>
              <Progress value={globalProgress.percent} className="h-2 bg-muted/40" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
              <ShieldAlert className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* If active item has finished processing, show video player comparison */}
          {activeItem?.status === "completed" && activeItem.cleanedUrl && (
            <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-card overflow-hidden shadow-2xl">
              <div className="relative flex h-[480px] w-full items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  src={showOriginal ? activeItem.originalUrl : activeItem.cleanedUrl}
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
          )}

          {/* Interactive Tuner for active video */}
          {activeFrame && (
            <div className="flex flex-col gap-4">
              <VideoTuner
                frame={activeFrame}
                sparkleImg={sparkleImg}
                base={baseBox}
                settings={settings}
                onChange={setSettings}
              />
            </div>
          )}

          {/* Multi-Video Batch Drawer */}
          <VideoBatchDrawer
            items={items}
            activeId={activeId}
            isProcessing={isProcessing}
            onSelectActive={handleSelectActive}
            onRemoveItem={handleRemoveItem}
            onClearAll={handleClearAll}
            onAddVideos={handleFilesSelected}
            onProcessAll={handleProcessAll}
          />
        </div>
      )}
    </div>
  );
}
