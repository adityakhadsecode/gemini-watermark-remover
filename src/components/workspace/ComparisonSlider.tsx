"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  SplitSquareVertical,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Rect } from "@/lib/watermark/types";

interface ComparisonSliderProps {
  originalUrl: string;
  cleanedUrl: string;
  watermarkRegion?: Rect | null;
  manualRegion?: Rect | null;
  onManualRegionChange?: (region: Rect | null) => void;
  isManualMode?: boolean;
}

export function ComparisonSlider({
  originalUrl,
  cleanedUrl,
  watermarkRegion,
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0..100
  const [isDragging, setIsDragging] = useState(false);
  const [isPeekingOriginal, setIsPeekingOriginal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Keyboard shortcut: hold V or Space to peek original
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "v" || e.key === "V" || e.code === "Space") {
        if (!e.repeat) setIsPeekingOriginal(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V" || e.code === "Space") {
        setIsPeekingOriginal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Slider drag handling
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleSliderMove(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    } else if (isPanning) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({
        x: dragStart.current.panX + dx,
        y: dragStart.current.panY + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setIsPanning(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture release fails
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPos(50);
  };

  const focusWatermark = () => {
    if (!watermarkRegion) return;
    setZoom(2.5);
    setPan({ x: -100, y: -100 });
  };

  return (
    <div className="relative flex flex-col w-full rounded-2xl border border-white/[0.08] bg-[#0c0e15] overflow-hidden shadow-2xl">
      {/* Top Studio Control Bar */}
      <div className="flex h-12 items-center justify-between border-b border-white/[0.07] bg-[#0f121a]/90 backdrop-blur-md px-4 text-xs">
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="font-mono text-[11px] font-medium text-slate-300 border-white/[0.1] bg-white/[0.02] px-2 py-0.5">
            {Math.round(zoom * 100)}%
          </Badge>
          <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
              className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={resetView}
              className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
              title="Reset View"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {watermarkRegion && (
            <Button
              variant="outline"
              size="xs"
              onClick={focusWatermark}
              className="btn-press text-[11px] font-mono h-7 border-indigo-500/30 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/50"
            >
              <SlidersHorizontal className="h-3 w-3 mr-1.5 text-indigo-400" />
              Focus Watermark
            </Button>
          )}
        </div>

        {/* Peek Original Button */}
        <div className="flex items-center gap-2">
          <Button
            variant={isPeekingOriginal ? "default" : "secondary"}
            size="xs"
            onMouseDown={() => setIsPeekingOriginal(true)}
            onMouseUp={() => setIsPeekingOriginal(false)}
            onTouchStart={() => setIsPeekingOriginal(true)}
            onTouchEnd={() => setIsPeekingOriginal(false)}
            className={`btn-press text-[11px] h-7 gap-1.5 font-medium transition-all ${
              isPeekingOriginal
                ? "bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]"
            }`}
          >
            <Eye className="h-3 w-3" />
            <span>Hold to Peek Original</span>
            <kbd className="hidden sm:inline-block rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 shadow-inner">
              Space
            </kbd>
          </Button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative flex h-[560px] w-full select-none items-center justify-center overflow-hidden bg-[#07080c] cursor-crosshair"
      >
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 bg-grid-dots opacity-40" />

        <div
          className="relative max-h-full max-w-full transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Base Layer: Cleaned Image */}
          <img
            src={cleanedUrl}
            alt="Cleaned preview"
            className="max-h-[500px] w-auto max-w-full object-contain pointer-events-none rounded shadow-2xl"
            draggable={false}
          />

          {/* Overlay Layer: Original Image clipped by split-slider */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none rounded"
            style={{
              clipPath: isPeekingOriginal
                ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
                : `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
            }}
          >
            <img
              src={originalUrl}
              alt="Original watermarked"
              className="max-h-[500px] w-auto max-w-full object-contain pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Watermark Region Outline */}
          {watermarkRegion && (
            <div
              className="absolute border border-indigo-400/70 bg-indigo-500/10 pointer-events-none rounded-sm transition-all shadow-[0_0_12px_rgba(99,102,241,0.25)]"
              style={{
                left: `${watermarkRegion.x}px`,
                top: `${watermarkRegion.y}px`,
                width: `${watermarkRegion.width}px`,
                height: `${watermarkRegion.height}px`,
              }}
            >
              <span className="absolute -top-5 right-0 font-mono text-[9px] font-semibold text-indigo-300 bg-[#0c0e15]/90 px-1.5 py-0.5 rounded border border-indigo-500/30 shadow-md">
                {watermarkRegion.width}×{watermarkRegion.height}
              </span>
            </div>
          )}

          {/* Split Slider Divider Line & Handle */}
          {!isPeekingOriginal && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Luminous divider rule */}
              <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-gradient-to-b from-indigo-400 via-white to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]" />

              {/* High-end metallic floating handle */}
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-white to-slate-200 text-slate-900 shadow-[0_0_20px_rgba(0,0,0,0.6),0_0_10px_rgba(255,255,255,0.4)] border border-white/60 pointer-events-auto cursor-ew-resize hover:scale-115 active:scale-95 transition-all">
                <SplitSquareVertical className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>

        {/* Labels: Before & After Chips */}
        {!isPeekingOriginal && (
          <>
            <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0c0e15]/80 px-3 py-1 font-mono text-[10px] font-semibold text-slate-300 backdrop-blur-md shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              ORIGINAL
            </div>
            <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/70 px-3 py-1 font-mono text-[10px] font-semibold text-indigo-200 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              RESTORED
            </div>
          </>
        )}

        {isPeekingOriginal && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/95 px-4 py-1.5 font-mono text-xs font-bold text-black shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <Eye className="h-3.5 w-3.5" />
            <span>PEEKING ORIGINAL (HOLD SPACE / V)</span>
          </div>
        )}
      </div>
    </div>
  );
}
