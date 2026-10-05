"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Download, RefreshCw, Upload, Image as ImageIcon, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaDropzone } from "./MediaDropzone";
import { ComparisonSlider } from "./ComparisonSlider";
import { TuningDrawer } from "./TuningDrawer";
import { TelemetryBadge } from "./TelemetryBadge";
import { BatchDrawer, type BatchItem } from "./BatchDrawer";
import { processImageData } from "@/lib/watermark/engine";
import type { ProcessOptions, ProcessResult, Rect } from "@/lib/watermark/types";
import { DEFAULT_PROCESS_OPTIONS } from "@/lib/watermark/types";

export function ImageStudio() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [options, setOptions] = useState<ProcessOptions>(DEFAULT_PROCESS_OPTIONS);
  const [activeResult, setActiveResult] = useState<ProcessResult | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTuning, setShowTuning] = useState(false);

  // Hidden offscreen canvas for pixel extraction
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Process a single image file
  const processFile = useCallback(
    async (file: File, opts: ProcessOptions): Promise<{
      cleanedUrl: string;
      blob: Blob;
      result: ProcessResult;
      width: number;
      height: number;
    }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;

          // Create canvas matching image dimensions
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            return reject(new Error("Failed to create canvas 2D context"));
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, width, height);

          // Apply mathematical reverse alpha blending
          const result = processImageData(imageData, opts);

          // Write restored pixels back to canvas
          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              if (!blob) return reject(new Error("Failed to export canvas blob"));
              const cleanedUrl = URL.createObjectURL(blob);
              resolve({ cleanedUrl, blob, result, width, height });
            },
            "image/png",
            1.0,
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Failed to load image element"));
        };

        img.src = objectUrl;
      });
    },
    [],
  );

  // Handle newly selected/dropped files
  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);

    const newItems: BatchItem[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      cleanedUrl: null,
      status: "pending",
      blob: null,
    }));

    setItems((prev) => [...prev, ...newItems]);
    const startIndex = items.length;
    setActiveIndex(startIndex);

    // Automatically detect hardware cores (clamped between 2 and 6 parallel workers)
    const detectedCores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    const CONCURRENCY = Math.min(6, Math.max(2, detectedCores));
    let nextIdx = 0;

    const worker = async () => {
      while (nextIdx < files.length) {
        const i = nextIdx++;
        const file = files[i];
        const itemIdx = startIndex + i;

        setItems((prev) =>
          prev.map((item, idx) => (idx === itemIdx ? { ...item, status: "processing" } : item)),
        );

        try {
          const { cleanedUrl, blob, result, width, height } = await processFile(file, options);

          setItems((prev) =>
            prev.map((item, idx) =>
              idx === itemIdx
                ? {
                    ...item,
                    cleanedUrl,
                    blob,
                    status: result.status === "removed" ? "completed" : "skipped",
                    confidence: result.detection?.confidence,
                    variant: result.variant ?? undefined,
                  }
                : item,
            ),
          );

          if (itemIdx === startIndex) {
            setActiveResult(result);
            setDimensions({ width, height });
          }
        } catch (err) {
          console.error("Processing failed for", file.name, err);
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === itemIdx ? { ...item, status: "error", error: String(err) } : item,
            ),
          );
        }
      }
    };

    const workerPool = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker());
    await Promise.all(workerPool);

    setIsProcessing(false);
  };

  // Re-process active item when tuning options change
  const activeItem = items[activeIndex];

  const reprocessActiveItem = useCallback(async () => {
    if (!activeItem) return;
    setIsProcessing(true);

    try {
      // Fetch original blob
      const res = await fetch(activeItem.originalUrl);
      const blob = await res.blob();
      const file = new File([blob], activeItem.name, { type: blob.type });

      const { cleanedUrl, blob: newBlob, result, width, height } = await processFile(file, options);

      // Clean up previous blob URL
      if (activeItem.cleanedUrl) URL.revokeObjectURL(activeItem.cleanedUrl);

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === activeIndex
            ? {
                ...item,
                cleanedUrl,
                blob: newBlob,
                status: result.status === "removed" ? "completed" : "skipped",
                confidence: result.detection?.confidence,
                variant: result.variant ?? undefined,
              }
            : item,
        ),
      );

      setActiveResult(result);
      setDimensions({ width, height });
    } catch (err) {
      console.error("Reprocessing failed", err);
    } finally {
      setIsProcessing(false);
    }
  }, [activeItem, activeIndex, options, processFile]);

  // Download active restored file
  const downloadActive = () => {
    if (!activeItem?.cleanedUrl) return;
    const a = document.createElement("a");
    a.href = activeItem.cleanedUrl;
    const baseName = activeItem.name.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}-clean.png`;
    a.click();
  };

  const handleClear = () => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.cleanedUrl) URL.revokeObjectURL(item.cleanedUrl);
    });
    setItems([]);
    setActiveIndex(0);
    setActiveResult(null);
    setDimensions(null);
  };

  const handleRemoveItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      URL.revokeObjectURL(item.originalUrl);
      if (item.cleanedUrl) URL.revokeObjectURL(item.cleanedUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activeIndex >= items.length - 1) {
      setActiveIndex(Math.max(0, items.length - 2));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-6 px-4">
      {/* If no items loaded, show the primary Dropzone */}
      {items.length === 0 ? (
        <div className="flex flex-col gap-4">
          <MediaDropzone mode="image" onFilesSelected={handleFilesSelected} disabled={isProcessing} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top Actions & Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-[1.5px] border-[#c0c2a9] pb-4">
            <TelemetryBadge result={activeResult} dimensions={dimensions} />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTuning((s) => !s)}
                className={`text-xs gap-1.5 h-8 font-mono border-[1.5px] ${
                  showTuning
                    ? "bg-[#aafdc0] text-[#003d21] border-[#000000]"
                    : "border-[#c0c2a9] bg-[#ffffff] text-[#202020] hover:border-[#000000]"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Tuning & Profile</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={reprocessActiveItem}
                disabled={isProcessing}
                className="text-xs gap-1.5 h-8 font-mono border-[1.5px] border-[#c0c2a9] bg-[#ffffff] text-[#202020] hover:border-[#000000]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                <span>Re-run</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={downloadActive}
                disabled={!activeItem?.cleanedUrl}
                className="text-xs bg-[#202020] hover:bg-[#2e2e2e] text-[#ffffff] gap-1.5 h-8 rounded-[13px] font-mono"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Clean PNG</span>
              </Button>
            </div>
          </div>

          {/* Main Comparison Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className={`${showTuning ? "lg:col-span-3" : "lg:col-span-4"} flex flex-col gap-4`}>
              {activeItem && activeItem.cleanedUrl ? (
                <ComparisonSlider
                  originalUrl={activeItem.originalUrl}
                  cleanedUrl={activeItem.cleanedUrl}
                  watermarkRegion={activeResult?.region}
                />
              ) : (
                <div className="flex h-[480px] w-full items-center justify-center rounded-xl border border-white/[0.08] bg-card">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                    <span>Inverting watermark pixels...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Tuning Drawer */}
            {showTuning && (
              <div className="lg:col-span-1 flex flex-col gap-4">
                <TuningDrawer
                  options={options}
                  onChange={(newOpts) => {
                    setOptions(newOpts);
                  }}
                  onReset={() => {
                    setOptions(DEFAULT_PROCESS_OPTIONS);
                  }}
                  detectedConfidence={activeResult?.detection?.confidence}
                  detectedVariant={activeResult?.variant ?? undefined}
                  isProcessing={isProcessing}
                />
              </div>
            )}
          </div>

          {/* Batch Drawer */}
          <BatchDrawer
            items={items}
            activeIndex={activeIndex}
            onSelectIndex={(idx) => {
              setActiveIndex(idx);
              // Re-fetch result info if available
              const item = items[idx];
              if (item) {
                // Keep dimensions updated
              }
            }}
            onClear={handleClear}
            onRemoveItem={handleRemoveItem}
            onAddFiles={handleFilesSelected}
            isProcessing={isProcessing}
          />
        </div>
      )}
    </div>
  );
}
