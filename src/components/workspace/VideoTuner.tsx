"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Sliders, RotateCcw, Crosshair, Eye, Sparkles } from "lucide-react";
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
      mctx.strokeStyle = "#000000";
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
      zctx.strokeStyle = "#aafdc0";
      zctx.lineWidth = 2.5;
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
    <div className="flex flex-col gap-5 rounded-[22px] border-[1.5px] border-[#000000] bg-[#ffffff] p-5 text-sm font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b-[1.5px] border-[#c0c2a9] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] border-[1.5px] border-[#000000] bg-[#aafdc0] text-[#000000]">
            <Crosshair className="h-4 w-4" />
          </div>
          <span className="font-bold text-base text-[#000000] tracking-tight uppercase">
            Interactive Watermark Tuner
          </span>
          <Badge variant="outline" className="text-[10px] font-mono border-[1.5px] border-[#003d21]/30 text-[#003d21] bg-[#aafdc0]">
            LIVE PREVIEW
          </Badge>
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={() => applyPreset(activePreset)}
          className="text-xs text-[#5a5a4f] hover:text-[#000000] h-7 font-mono"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset Preset
        </Button>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#000000] uppercase tracking-wider font-mono">
          Veo Geometry Preset
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VIDEO_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-[13px] border-[1.5px] p-3 text-left transition-all ${
                activePreset === p.id
                  ? "border-[#000000] bg-[#edeee1] text-[#000000]"
                  : "border-[#c0c2a9] bg-transparent text-[#5a5a4f] hover:border-[#000000] hover:text-[#000000]"
              }`}
            >
              <div className="text-xs font-bold uppercase font-mono">{p.label}</div>
              <div className="text-[10px] text-[#5a5a4f] mt-0.5 line-clamp-1">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Views (Main + Zoomed Corner) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center bg-[#202020] rounded-[13px] p-4 border-[1.5px] border-[#000000]">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-[#f8f9eb] mb-1.5 flex items-center gap-1 uppercase tracking-wider">
            <Eye className="h-3 w-3 text-[#aafdc0]" /> Full Frame
          </span>
          <canvas
            ref={mainCanvasRef}
            className="rounded-[9px] border-[1.5px] border-[#c0c2a9]/40 bg-black max-h-48"
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-[#aafdc0] mb-1.5 flex items-center gap-1 uppercase tracking-wider font-semibold">
            <Crosshair className="h-3 w-3" /> Zoomed Corner (Cleaned)
          </span>
          <canvas
            ref={zoomCanvasRef}
            width={200}
            height={200}
            className="rounded-[9px] border-[1.5px] border-[#aafdc0] bg-black"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      <p className="text-[11px] text-[#5a5a4f] leading-relaxed font-sans">
        Tune the sliders until the watermark completely disappears in the{" "}
        <span className="text-[#003d21] font-mono font-semibold bg-[#aafdc0] px-1 rounded">green zoomed corner</span>. All adjustments apply in real time.
      </p>

      {/* Live Tuning Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-1">
        {/* Gain / Strength */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#5a5a4f]">Inversion Strength (Gain)</span>
            <span className="font-bold text-[#000000]">
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
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#5a5a4f]">Watermark Size</span>
            <span className="font-bold text-[#000000]">
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
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#5a5a4f]">Position Offset X</span>
            <span className="font-bold text-[#000000]">
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
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#5a5a4f]">Position Offset Y</span>
            <span className="font-bold text-[#000000]">
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
