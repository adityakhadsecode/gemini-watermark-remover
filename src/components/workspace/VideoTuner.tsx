"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Sliders, RotateCcw, Crosshair, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import type { VideoTunerSettings, VideoWatermarkBox } from "@/lib/video/types";
import { cleanFrame, VIDEO_PRESETS, VIDEO_DEFAULTS } from "@/lib/video/config";

interface VideoTunerProps {
  frame: { width: number; height: number; imageData: ImageData } | null;
  sparkleImg: HTMLImageElement | null;
  base: VideoWatermarkBox | null;
  settings: VideoTunerSettings;
  onChange: (settings: VideoTunerSettings) => void;
}

export function VideoTuner({
  frame,
  sparkleImg,
  base,
  settings,
  onChange,
}: VideoTunerProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activePreset, setActivePreset] = useState<"veo" | "corner">("veo");

  // Renders the live cleaned frame and corner zoom
  const renderTuner = useCallback(() => {
    if (!frame || !sparkleImg || !base || !mainCanvasRef.current || !zoomCanvasRef.current) return;

    const { width, height, imageData } = frame;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const offscreen = offscreenCanvasRef.current;
    offscreen.width = width;
    offscreen.height = height;

    const copyData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      width,
      height,
    );

    const { wm, roi } = cleanFrame(sparkleImg, copyData, width, height, base, settings);
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;
    offCtx.putImageData(copyData, 0, 0);

    // 1. Draw Main Overview Canvas
    const main = mainCanvasRef.current;
    const maxW = 340;
    const scale = Math.min(1, maxW / width);
    main.width = Math.round(width * scale);
    main.height = Math.round(height * scale);
    const mctx = main.getContext("2d");
    if (mctx) {
      mctx.drawImage(offscreen, 0, 0, main.width, main.height);
      mctx.strokeStyle = "#6366f1";
      mctx.lineWidth = 2;
      mctx.strokeRect(wm.x * scale, wm.y * scale, wm.width * scale, wm.height * scale);
    }

    // 2. Draw Zoomed Corner Canvas (200x200, magnified)
    const zoom = zoomCanvasRef.current;
    const zctx = zoom.getContext("2d");
    if (zctx) {
      zctx.imageSmoothingEnabled = false;
      zctx.clearRect(0, 0, zoom.width, zoom.height);
      zctx.drawImage(
        offscreen,
        roi.x,
        roi.y,
        roi.width,
        roi.height,
        0,
        0,
        zoom.width,
        zoom.height,
      );
      const sx = zoom.width / roi.width;
      const sy = zoom.height / roi.height;
      zctx.strokeStyle = "#10b981";
      zctx.lineWidth = 2;
      zctx.strokeRect((wm.x - roi.x) * sx, (wm.y - roi.y) * sy, wm.width * sx, wm.height * sy);
    }
  }, [frame, sparkleImg, base, settings]);

  useEffect(() => {
    renderTuner();
  }, [renderTuner]);

  const applyPreset = (presetId: "veo" | "corner") => {
    setActivePreset(presetId);
    const preset = VIDEO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onChange({ ...preset.settings });
    }
  };

  const toNumber = (val: number | readonly number[]): number => {
    return Array.isArray(val) ? val[0] : typeof val === "number" ? val : 0;
  };

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-white/[0.08] bg-card p-4 sm:p-5 shadow-sm text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-foreground">Interactive Watermark Tuner</span>
          <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Live Preview
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => applyPreset(activePreset)}
          className="text-xs text-muted-foreground hover:text-foreground h-6"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset to Preset
        </Button>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Veo Geometry Preset</label>
        <div className="grid grid-cols-2 gap-2">
          {VIDEO_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-lg border px-3 py-2 text-left transition-all ${
                activePreset === p.id
                  ? "border-indigo-500/40 bg-indigo-500/10 text-foreground"
                  : "border-white/[0.08] bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <div className="text-xs font-semibold">{p.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Views (Main + Zoomed Corner) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center bg-black/40 rounded-xl p-3 border border-white/[0.05]">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-muted-foreground mb-1 flex items-center gap-1">
            <Eye className="h-3 w-3 text-indigo-400" /> Full Frame
          </span>
          <canvas
            ref={mainCanvasRef}
            className="rounded-lg border border-white/[0.1] bg-black/60 shadow-inner max-h-48"
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-emerald-400 mb-1 flex items-center gap-1">
            <Crosshair className="h-3 w-3" /> Zoomed Watermark (Cleaned)
          </span>
          <canvas
            ref={zoomCanvasRef}
            width={200}
            height={200}
            className="rounded-lg border border-emerald-500/30 bg-black/80 shadow-md"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Adjust the sliders below until the watermark vanishes in the{" "}
        <span className="text-emerald-400 font-mono">green zoomed box</span>. The watermark box matches Veo&apos;s dynamic resolution scale.
      </p>

      {/* Live Tuning Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 pt-1">
        {/* Gain / Strength */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Inversion Strength (Gain)</span>
            <span className="font-mono text-[11px] text-foreground font-semibold">
              {settings.gain.toFixed(2)}×
            </span>
          </div>
          <Slider
            value={[settings.gain]}
            min={0.1}
            max={3.0}
            step={0.05}
            onValueChange={(val) => onChange({ ...settings, gain: toNumber(val) })}
          />
        </div>

        {/* Size Scale */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Watermark Size</span>
            <span className="font-mono text-[11px] text-foreground font-semibold">
              {settings.sizeScale.toFixed(2)}×
            </span>
          </div>
          <Slider
            value={[settings.sizeScale]}
            min={0.2}
            max={2.0}
            step={0.05}
            onValueChange={(val) => onChange({ ...settings, sizeScale: toNumber(val) })}
          />
        </div>

        {/* Offset X */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Position Offset X</span>
            <span className="font-mono text-[11px] text-foreground font-semibold">
              {settings.offsetX > 0 ? `+${settings.offsetX}` : settings.offsetX} px
            </span>
          </div>
          <Slider
            value={[settings.offsetX]}
            min={-150}
            max={150}
            step={1}
            onValueChange={(val) => onChange({ ...settings, offsetX: toNumber(val) })}
          />
        </div>

        {/* Offset Y */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Position Offset Y</span>
            <span className="font-mono text-[11px] text-foreground font-semibold">
              {settings.offsetY > 0 ? `+${settings.offsetY}` : settings.offsetY} px
            </span>
          </div>
          <Slider
            value={[settings.offsetY]}
            min={-150}
            max={150}
            step={1}
            onValueChange={(val) => onChange({ ...settings, offsetY: toNumber(val) })}
          />
        </div>
      </div>
    </div>
  );
}
