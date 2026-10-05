"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  SplitSquareVertical,
  Eye,
  SlidersHorizontal,
  RefreshCw,
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
  manualRegion,
  onManualRegionChange,
  isManualMode = false,
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
    // If clicking directly on or near the slider handle
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

  // Jump zoom directly to the watermark region for close inspection
  const focusWatermark = () => {
    if (!watermarkRegion) return;
    setZoom(2.5);
    setPan({ x: -100, y: -100 });
  };

  return (
    <div className="relative flex flex-col w-full rounded-xl border border-white/[0.08] bg-card overflow-hidden shadow-2xl">
      {/* Top Studio Control Bar */}
      <div className="flex h-11 items-center justify-between border-b border-white/[0.08] bg-muted/20 px-3 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-white/[0.08]">
            {Math.round(zoom * 100)}%
          </Badge>
          <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={resetView}
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
              className="text-[11px] font-mono h-6 border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
            >
              <SlidersHorizontal className="h-3 w-3 mr-1" />
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
            className="text-[11px] h-6 gap-1"
          >
            <Eye className="h-3 w-3" />
            <span>Hold to Peek Original</span>
            <kbd className="hidden sm:inline-block rounded bg-muted/60 px-1 text-[9px] font-mono text-muted-foreground">
              V
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
        className="relative flex h-[540px] w-full select-none items-center justify-center overflow-hidden bg-black/60 cursor-crosshair"
      >
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
            className="max-h-[500px] w-auto max-w-full object-contain pointer-events-none rounded"
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

          {/* Watermark Region Outline (Subtle bounding box indicator) */}
          {watermarkRegion && (
            <div
              className="absolute border border-indigo-400/60 bg-indigo-500/10 pointer-events-none rounded-sm transition-all"
              style={{
                left: `${watermarkRegion.x}px`,
                top: `${watermarkRegion.y}px`,
                width: `${watermarkRegion.width}px`,
                height: `${watermarkRegion.height}px`,
              }}
            >
              <span className="absolute -top-4 right-0 font-mono text-[9px] text-indigo-400 bg-background/80 px-1 rounded border border-indigo-500/30">
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
              {/* Divider vertical rule */}
              <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]" />

              {/* Floating handle */}
              <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-900 shadow-xl border border-zinc-200 pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
                <SplitSquareVertical className="h-3.5 w-3.5" />
              </div>
            </div>
          )}
        </div>

        {/* Labels: Before & After */}
        {!isPeekingOriginal && (
          <>
            <div className="absolute top-4 left-4 pointer-events-none rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white/90 border border-white/10 backdrop-blur-sm">
              ORIGINAL
            </div>
            <div className="absolute top-4 right-4 pointer-events-none rounded bg-indigo-500/80 px-2 py-0.5 font-mono text-[10px] text-white border border-indigo-400/40 backdrop-blur-sm shadow-sm">
              RESTORED
            </div>
          </>
        )}

        {isPeekingOriginal && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none rounded bg-amber-500/90 px-3 py-1 font-mono text-xs font-semibold text-black shadow-lg">
            PEEKING ORIGINAL (V / SPACE)
          </div>
        )}
      </div>
    </div>
  );
}
