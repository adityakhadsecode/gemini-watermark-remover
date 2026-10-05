"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Download,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Plus,
  Film,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import JSZip from "jszip";
import { toast } from "sonner";

export interface VideoBatchItem {
  id: string;
  name: string;
  file: File;
  originalUrl: string;
  cleanedUrl: string | null;
  cleanedBlob: Blob | null;
  status: "pending" | "processing" | "completed" | "error";
  progressPercent: number;
  previewThumbnailUrl: string | null;
  width?: number;
  height?: number;
  durationSeconds?: number;
  totalFrames?: number;
  error?: string;
}

interface VideoBatchDrawerProps {
  items: VideoBatchItem[];
  activeId: string | null;
  isProcessing: boolean;
  onSelectActive: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onAddVideos: (files: File[]) => void;
  onProcessAll: () => void;
}

export function VideoBatchDrawer({
  items,
  activeId,
  isProcessing,
  onSelectActive,
  onRemoveItem,
  onClearAll,
  onAddVideos,
  onProcessAll,
}: VideoBatchDrawerProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [autoDownloadZip, setAutoDownloadZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevProcessingRef = useRef(false);

  const completedCount = items.filter((i) => i.status === "completed").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const inProgressItem = items.find((i) => i.status === "processing");
  const overallPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const downloadAllAsZip = useCallback(async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const item of items) {
        if (item.cleanedBlob) {
          const cleanName = item.name.replace(/\.[^/.]+$/, "") + "-clean.mp4";
          zip.file(cleanName, item.cleanedBlob);
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "veo-watermark-removed-batch.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate zip bundle:", err);
      toast.error("Failed to generate ZIP archive");
    } finally {
      setIsZipping(false);
    }
  }, [items]);

  useEffect(() => {
    if (prevProcessingRef.current && !isProcessing && items.length > 0) {
      const finished = items.filter((i) => i.status === "completed");
      if (finished.length > 0) {
        if (autoDownloadZip) {
          downloadAllAsZip();
          toast.success(`Video queue complete! Downloaded ${finished.length} videos as ZIP.`, {
            duration: 5000,
          });
        } else {
          toast.success(`Video queue complete! ${finished.length} videos ready.`, {
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

  const downloadSingle = (item: VideoBatchItem) => {
    if (!item.cleanedUrl) return;
    const a = document.createElement("a");
    a.href = item.cleanedUrl;
    const cleanName = item.name.replace(/\.[^/.]+$/, "") + "-clean.mp4";
    a.download = cleanName;
    a.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onAddVideos) {
      const files = Array.from(e.target.files);
      onAddVideos(files);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-[#000000] bg-[#ffffff] p-5 font-sans">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp4, .webm, .mov"
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
            Video Batch Queue ({completedCount}/{items.length} Completed)
          </span>
          {isProcessing && (
            <Badge variant="outline" className="text-[10px] font-mono border-[#000000] text-[#000000] bg-[#aafdc0] gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Processing Sequential
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="xs"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs h-7 border-[1.5px] border-[#c0c2a9] hover:border-[#000000] gap-1 font-mono"
          >
            <Plus className="h-3 w-3" />
            Add Videos
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={onClearAll}
            disabled={isProcessing}
            className="text-xs h-7 text-[#5a5a4f] hover:text-[#000000] font-mono"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>

          {pendingCount > 0 && (
            <Button
              variant="default"
              size="xs"
              onClick={onProcessAll}
              disabled={isProcessing}
              className="text-xs h-7 bg-[#202020] hover:bg-[#2e2e2e] text-[#ffffff] gap-1.5 rounded-[13px] font-mono"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span>Process All ({pendingCount})</span>
            </Button>
          )}

          <label className="flex items-center gap-1.5 text-xs text-[#202020] cursor-pointer select-none font-mono">
            <input
              type="checkbox"
              checked={autoDownloadZip}
              onChange={(e) => setAutoDownloadZip(e.target.checked)}
              className="h-3.5 w-3.5 rounded-[4px] border-[1.5px] border-[#000000] accent-[#202020] cursor-pointer"
            />
            Auto-download ZIP
          </label>

          {completedCount > 0 && (
            <Button
              variant="outline"
              size="xs"
              onClick={downloadAllAsZip}
              disabled={isZipping}
              className="text-xs h-7 bg-[#edeee1] border-[1.5px] border-[#c0c2a9] hover:border-[#000000] text-[#000000] gap-1 rounded-[13px] font-mono"
            >
              {isZipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export All (.ZIP)
            </Button>
          )}
        </div>
      </div>

      {/* Overall Queue Progress Bar */}
      {isProcessing && (
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <div className="flex justify-between text-[#5a5a4f]">
            <span>Overall Batch Progress</span>
            <span className="font-bold text-[#000000]">{overallPercent}%</span>
          </div>
          <div className="w-full bg-[#edeee1] rounded-full h-2 border border-[#c0c2a9] overflow-hidden">
            <div
              className="bg-[#202020] h-full transition-all duration-300"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Video Queue List */}
      <div className="flex flex-col divide-y divide-[#c0c2a9]/50 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectActive(item.id)}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 px-3 rounded-[13px] cursor-pointer transition-all ${
                isActive
                  ? "bg-[#edeee1] border-[1.5px] border-[#000000]"
                  : "hover:bg-[#f8f9eb] border-[1.5px] border-transparent"
              }`}
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-[9px] border-[1.5px] border-[#000000] bg-black">
                  {item.previewThumbnailUrl ? (
                    <img
                      src={item.previewThumbnailUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Film className="h-5 w-5 text-[#c0c2a9]" />
                  )}
                  {item.status === "completed" && (
                    <div className="absolute inset-0 bg-[#aafdc0]/80 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-[#003d21]" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#000000] truncate max-w-xs sm:max-w-sm">
                      {item.name}
                    </span>
                    {isActive && (
                      <Badge variant="outline" className="text-[9px] font-mono border-[1.5px] border-[#003d21]/30 text-[#003d21] bg-[#aafdc0]">
                        Active Tuner
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#5a5a4f] mt-0.5">
                    {item.width && item.height && (
                      <span>{item.width}×{item.height}</span>
                    )}
                    {item.durationSeconds && (
                      <span>· {item.durationSeconds.toFixed(1)}s</span>
                    )}
                    {item.totalFrames && item.status === "completed" && (
                      <span className="text-[#003d21] font-semibold">· {item.totalFrames} frames cleaned</span>
                    )}
                  </div>

                  {/* Progress bar per item if actively processing */}
                  {item.status === "processing" && (
                    <div className="w-48 mt-1.5 flex items-center gap-2">
                      <div className="w-full bg-[#edeee1] rounded-full h-1.5 border border-[#c0c2a9] overflow-hidden">
                        <div
                          className="bg-[#202020] h-full"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#000000]">{item.progressPercent}%</span>
                    </div>
                  )}
                  {item.error && (
                    <span className="text-[10px] text-red-600 font-mono mt-1 font-semibold">{item.error}</span>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                {item.status === "completed" && item.cleanedUrl && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => downloadSingle(item)}
                    className="text-xs h-7 border-[1.5px] border-[#000000] bg-[#aafdc0] text-[#003d21] hover:bg-[#96f2af] gap-1 font-mono rounded-[9px]"
                  >
                    <Download className="h-3 w-3" />
                    Download MP4
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={item.status === "processing"}
                  className="text-[#5a5a4f] hover:text-red-600 h-7 w-7"
                  title="Remove from queue"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
