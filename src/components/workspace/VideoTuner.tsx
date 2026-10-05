"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw, Crosshair, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import type { VideoTunerSettings, VideoWatermarkBox } from "@/lib/video/types";
import { cleanFrame, VIDEO_PRESETS } from "@/lib/video/config";

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
    <div className="glass-panel flex flex-col gap-5 rounded-2xl p-5 shadow-2xl text-sm border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Crosshair className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">Interactive Watermark Tuner</span>
          <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-300 bg-emerald-500/10 px-2">
            Live Preview
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => applyPreset(activePreset)}
          className="btn-press text-xs text-muted-foreground hover:text-foreground h-7 px-2.5 hover:bg-white/[0.04]"
        >
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Reset Preset
        </Button>
      </div>

      {/* Preset Cards */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-foreground tracking-tight">Veo Geometry Preset</label>
        <div className="grid grid-cols-2 gap-2.5">
          {VIDEO_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`btn-press rounded-xl border p-3 text-left transition-all ${
                activePreset === p.id
                  ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/15 to-indigo-500/5 text-foreground shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                  : "border-white/[0.08] bg-[#0c0f17] text-muted-foreground hover:bg-[#121622] hover:text-foreground"
              }`}
            >
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                {p.label}
              </div>
              <div className="text-[10px] text-muted-foreground/80 mt-1 line-clamp-1">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Views (Main + Zoomed Corner) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center bg-[#07080c] rounded-2xl p-4 border border-white/[0.07] shadow-inner">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-indigo-400" /> Full Frame
          </span>
          <canvas
            ref={mainCanvasRef}
            className="rounded-xl border border-white/[0.1] bg-black/80 shadow-2xl max-h-48"
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-emerald-300 mb-1.5 flex items-center gap-1.5">
            <Crosshair className="h-3 w-3 text-emerald-400" /> Zoomed Corner (Cleaned)
          </span>
          <canvas
            ref={zoomCanvasRef}
            width={200}
            height={200}
            className="rounded-xl border border-emerald-500/40 bg-black shadow-[0_0_24px_rgba(16,185,129,0.15)]"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/90 leading-relaxed">
        Adjust the sliders below until the watermark vanishes in the{" "}
        <span className="text-emerald-400 font-mono font-semibold">green zoomed box</span>. The watermark box adapts dynamically to video resolution.
      </p>

      {/* Live Tuning Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-1">
        {/* Gain / Strength */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">Inversion Strength (Gain)</span>
            <span className="font-mono text-[11px] text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
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
            <span className="text-muted-foreground text-[11px]">Watermark Size</span>
            <span className="font-mono text-[11px] text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
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
            <span className="text-muted-foreground text-[11px]">Position Offset X</span>
            <span className="font-mono text-[11px] text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
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
            <span className="text-muted-foreground text-[11px]">Position Offset Y</span>
            <span className="font-mono text-[11px] text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
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
