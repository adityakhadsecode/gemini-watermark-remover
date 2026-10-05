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
      // Ignore
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
    <div className="relative flex flex-col w-full rounded-[22px] border-[1.5px] border-[#000000] bg-[#ffffff] overflow-hidden">
      {/* Top Studio Control Bar: Bone (#edeee1) background with Sage Mist border */}
      <div className="flex h-12 items-center justify-between border-b-[1.5px] border-[#c0c2a9] bg-[#edeee1] px-4 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[11px] bg-[#ffffff] text-[#000000] border-[#c0c2a9]">
            {Math.round(zoom * 100)}%
          </Badge>
          <div className="flex items-center gap-1 border-l-[1.5px] border-[#c0c2a9] pl-2">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
              title="Zoom In"
              className="bg-[#ffffff]"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              title="Zoom Out"
              className="bg-[#ffffff]"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={resetView}
              title="Reset View"
              className="bg-[#ffffff]"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {watermarkRegion && (
            <Button
              variant="outline"
              size="xs"
              onClick={focusWatermark}
              className="text-[11px] font-mono h-7 border-[#000000] bg-[#aafdc0] text-[#003d21] hover:bg-[#96f2af]"
            >
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              Focus Watermark
            </Button>
          )}
        </div>

        {/* Peek Original Button */}
        <div className="flex items-center gap-2">
          <Button
            variant={isPeekingOriginal ? "default" : "outline"}
            size="xs"
            onMouseDown={() => setIsPeekingOriginal(true)}
            onMouseUp={() => setIsPeekingOriginal(false)}
            onTouchStart={() => setIsPeekingOriginal(true)}
            onTouchEnd={() => setIsPeekingOriginal(false)}
            className="text-[11px] h-7 gap-1.5 font-mono"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Hold to Peek Original</span>
            <kbd className="hidden sm:inline-block rounded-[4px] border border-[#c0c2a9] bg-[#ffffff] px-1 text-[9px] font-mono text-[#000000]">
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
        className="relative flex h-[540px] w-full select-none items-center justify-center overflow-hidden bg-[#202020] cursor-crosshair"
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
            className="max-h-[500px] w-auto max-w-full object-contain pointer-events-none rounded-[13px]"
            draggable={false}
          />

          {/* Overlay Layer: Original Image clipped by split-slider */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none rounded-[13px]"
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
              className="absolute border-[1.5px] border-[#aafdc0] bg-[#aafdc0]/20 pointer-events-none rounded-[4px] transition-all"
              style={{
                left: `${watermarkRegion.x}px`,
                top: `${watermarkRegion.y}px`,
                width: `${watermarkRegion.width}px`,
                height: `${watermarkRegion.height}px`,
              }}
            >
              <span className="absolute -top-5 right-0 font-mono text-[9px] text-[#003d21] bg-[#aafdc0] px-1 py-0.5 rounded-[4px] border border-[#003d21]/30">
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
              {/* Divider vertical rule: 2px solid white */}
              <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-[#ffffff]" />

              {/* Floating handle: 30px circular with black border and white fill */}
              <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-[#ffffff] text-[#000000] border-[1.5px] border-[#000000] pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
                <SplitSquareVertical className="h-3.5 w-3.5" />
              </div>
            </div>
          )}
        </div>

        {/* Labels: Before & After Pill Badges */}
        {!isPeekingOriginal && (
          <>
            <div className="absolute top-4 left-4 pointer-events-none rounded-full bg-[#202020] text-[#f8f9eb] border-[1.5px] border-[#c0c2a9] px-3 py-1 font-mono text-[10px] tracking-wider uppercase">
              ORIGINAL
            </div>
            <div className="absolute top-4 right-4 pointer-events-none rounded-full bg-[#aafdc0] text-[#003d21] border-[1.5px] border-[#003d21]/30 px-3 py-1 font-mono text-[10px] tracking-wider uppercase font-semibold">
              RESTORED
            </div>
          </>
        )}

        {isPeekingOriginal && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none rounded-full bg-[#ffc0e6] text-[#3f0929] border-[1.5px] border-[#3f0929]/40 px-4 py-1 font-mono text-xs font-semibold tracking-wider uppercase">
            PEEKING ORIGINAL (V / SPACE)
          </div>
        )}
      </div>
    </div>
  );
}
