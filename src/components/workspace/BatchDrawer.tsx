"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Download, FileArchive, CheckCircle2, AlertTriangle, Loader2, Trash2, Plus, X } from "lucide-react";
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
    <div className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-[#000000] bg-[#ffffff] p-5 font-sans">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png, .jpg, .jpeg, .webp"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drawer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-[1.5px] border-[#c0c2a9] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] border-[1.5px] border-[#000000] bg-[#aafdc0] text-[#000000]">
            <FileArchive className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-[#000000] tracking-tight uppercase font-mono">
            Image Batch Queue ({completedCount}/{items.length} Ready)
          </span>
          {inProgressCount > 0 && (
            <Badge variant="outline" className="text-[10px] font-mono border-[#000000] text-[#000000] bg-[#aafdc0] gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              {inProgressCount} parallel workers active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-[#202020] cursor-pointer select-none font-mono">
            <input
              type="checkbox"
              checked={autoDownloadZip}
              onChange={(e) => setAutoDownloadZip(e.target.checked)}
              className="h-3.5 w-3.5 rounded-[4px] border-[1.5px] border-[#000000] accent-[#202020] cursor-pointer"
            />
            Auto-download ZIP
          </label>

          {onAddFiles && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-7 border-[1.5px] border-[#c0c2a9] hover:border-[#000000] gap-1 font-mono"
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
            className="text-xs h-7 text-[#5a5a4f] hover:text-[#000000] font-mono"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>

          <Button
            variant="default"
            size="xs"
            disabled={isZipping || completedCount === 0}
            onClick={downloadAllAsZip}
            className="text-xs h-7 bg-[#202020] hover:bg-[#2e2e2e] text-[#ffffff] gap-1 font-mono rounded-[13px]"
          >
            {isZipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Export All ZIP
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {completedCount < items.length && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-xs text-[#5a5a4f]">
            <span>Processing Queue</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#edeee1] rounded-full h-2 border border-[#c0c2a9] overflow-hidden">
            <div
              className="bg-[#202020] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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
              className={`group relative flex h-20 w-20 flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-[13px] border-[1.5px] transition-all ${
                isActive
                  ? "border-[#000000] ring-2 ring-[#aafdc0]"
                  : "border-[#c0c2a9] bg-[#edeee1] hover:border-[#000000]"
              }`}
            >
              <img
                src={item.cleanedUrl || item.originalUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />

              {/* Status overlay badge */}
              <div className="absolute top-1 right-1 flex items-center gap-1">
                {item.status === "completed" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#003d21] bg-[#aafdc0] rounded-full" />
                )}
                {item.status === "skipped" && (
                  <AlertTriangle className="h-3.5 w-3.5 text-[#3f0929] bg-[#ffc0e6] rounded-full" />
                )}
                {item.status === "processing" && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#000000] bg-[#ffffff] rounded-full" />
                )}

                {/* Remove button on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#202020] hover:bg-red-600 text-white rounded-[4px] p-0.5"
                  title="Remove item"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Filename bottom */}
              <div className="absolute bottom-0 inset-x-0 bg-[#202020]/80 p-1">
                <p className="truncate text-[9px] font-mono text-[#ffffff]">
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
