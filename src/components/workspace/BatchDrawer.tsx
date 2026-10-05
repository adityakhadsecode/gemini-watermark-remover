"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Download, FileArchive, CheckCircle2, AlertTriangle, Loader2, Trash2, Plus, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import JSZip from "jszip";
import { toast } from "sonner";

export interface BatchItem {
  id: string;
  name: string;
  originalUrl: string;
  cleanedUrl: string | null;
  status: "pending" | "processing" | "completed" | "skipped" | "error";
  confidence?: number;
  variant?: string;
  blob?: Blob | null;
  error?: string;
}

interface BatchDrawerProps {
  items: BatchItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onClear: () => void;
  onRemoveItem: (id: string) => void;
  onAddFiles?: (files: File[]) => void;
  isProcessing?: boolean;
}

export function BatchDrawer({
  items,
  activeIndex,
  onSelectIndex,
  onClear,
  onRemoveItem,
  onAddFiles,
  isProcessing,
}: BatchDrawerProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [autoDownloadZip, setAutoDownloadZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevProcessingRef = useRef(false);

  const completedCount = items.filter((i) => i.status === "completed" || i.status === "skipped").length;
  const inProgressCount = items.filter((i) => i.status === "processing").length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const downloadAllAsZip = useCallback(async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const item of items) {
        if (item.blob) {
          const cleanName = item.name.replace(/\.[^/.]+$/, "") + "-clean.png";
          zip.file(cleanName, item.blob);
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gemini-watermark-removed-batch.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate zip:", err);
      toast.error("Failed to generate ZIP archive");
    } finally {
      setIsZipping(false);
    }
  }, [items]);

  useEffect(() => {
    if (prevProcessingRef.current && !isProcessing && items.length > 0) {
      const readyItems = items.filter((i) => i.status === "completed" || i.status === "skipped");
      if (readyItems.length > 0) {
        if (autoDownloadZip) {
          downloadAllAsZip();
          toast.success(`Batch complete! Downloaded ${readyItems.length} cleaned images.`, {
            duration: 5000,
          });
        } else {
          toast.success(`Batch complete! ${readyItems.length} images processed.`, {
            action: {
              label: "Download ZIP",
              onClick: () => downloadAllAsZip(),
            },
            duration: 8000,
          });
        }
      }
    }
    prevProcessingRef.current = !!isProcessing;
  }, [isProcessing, autoDownloadZip, items, downloadAllAsZip]);

  if (items.length === 0) return null;

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onAddFiles) {
      const files = Array.from(e.target.files);
      onAddFiles(files);
      e.target.value = "";
    }
  };

  return (
    <div className="glass-panel flex flex-col gap-3.5 rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/[0.08]">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png, .jpg, .jpeg, .webp"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drawer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight text-foreground">
            Image Batch Queue ({completedCount}/{items.length} Ready)
          </span>
          {inProgressCount > 0 && (
            <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-300 bg-indigo-500/10 gap-1.5 px-2 py-0.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              {inProgressCount} parallel workers active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoDownloadZip}
              onChange={(e) => setAutoDownloadZip(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/20 bg-muted/40 accent-indigo-500 cursor-pointer"
            />
            Auto-download ZIP
          </label>

          {onAddFiles && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              className="btn-press text-[11px] h-7 border-dashed border-white/[0.18] hover:border-indigo-400 hover:text-indigo-300 gap-1.5 px-2.5"
            >
              <Plus className="h-3 w-3" />
              Add More
            </Button>
          )}

          <Button
            variant="outline"
            size="xs"
            onClick={onClear}
            disabled={isProcessing}
            className="btn-press text-[11px] h-7 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] px-2.5"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>

          <Button
            variant="default"
            size="xs"
            disabled={isZipping || completedCount === 0}
            onClick={downloadAllAsZip}
            className="btn-press text-[11px] h-7 bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-[0_0_20px_rgba(99,102,241,0.25)] px-3 font-semibold"
          >
            {isZipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Export All (.ZIP)
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {completedCount < items.length && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>Overall Queue Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5 bg-white/[0.05]" />
        </div>
      )}

      {/* Thumbnail Strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={item.id}
              onClick={() => onSelectIndex(idx)}
              className={`group relative flex h-22 w-22 flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-200 ${
                isActive
                  ? "border-indigo-500 ring-2 ring-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] scale-[1.02]"
                  : "border-white/[0.08] bg-[#0c0f17] hover:border-white/[0.2] hover:bg-[#121622]"
              }`}
            >
              <img
                src={item.cleanedUrl || item.originalUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />

              {/* Status overlay badge */}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                {item.status === "completed" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 bg-black/80 rounded-full shadow-sm" />
                )}
                {item.status === "skipped" && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 bg-black/80 rounded-full shadow-sm" />
                )}
                {item.status === "processing" && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400 bg-black/80 rounded-full shadow-sm" />
                )}

                {/* Remove button on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 hover:bg-red-500 text-white rounded p-0.5"
                  title="Remove item"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Filename bottom gradient */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-1.5">
                <p className="truncate text-[9px] font-mono font-medium text-white/90">
                  {item.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
