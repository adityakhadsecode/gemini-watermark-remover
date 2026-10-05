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
  Play,
  Film,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-card p-4 sm:p-5 shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp4, .webm, .mov"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Header & Main Batch Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-xs text-foreground">
            Video Batch Queue ({completedCount}/{items.length} Ready)
          </span>
          {inProgressItem && (
            <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-400 bg-indigo-500/10 gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Processing: {inProgressItem.name} ({inProgressItem.progressPercent}%)
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="text-[11px] h-7 border-dashed border-white/[0.2] hover:border-indigo-400 hover:text-indigo-300 gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Videos
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={onClearAll}
            disabled={isProcessing}
            className="text-[11px] h-7 text-muted-foreground hover:text-foreground"
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
              className="text-[11px] h-7 bg-indigo-600 hover:bg-indigo-500 text-white gap-1 shadow-sm"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span>Process All ({pendingCount} queued)</span>
            </Button>
          )}

          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoDownloadZip}
              onChange={(e) => setAutoDownloadZip(e.target.checked)}
              className="h-3 w-3 rounded border-white/20 bg-muted/40 accent-indigo-500 cursor-pointer"
            />
            Auto-download ZIP
          </label>

          {completedCount > 0 && (
            <Button
              variant="secondary"
              size="xs"
              onClick={downloadAllAsZip}
              disabled={isZipping}
              className="text-[11px] h-7 gap-1 shadow-sm"
            >
              {isZipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export All (.ZIP)
            </Button>
          )}
        </div>
      </div>

      {/* Overall Queue Progress Bar */}
      {isProcessing && (
        <div className="flex flex-col gap-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-muted-foreground">
            <span>Overall Batch Progress</span>
            <span>{overallPercent}%</span>
          </div>
          <Progress value={overallPercent} className="h-1.5 bg-muted/40" />
        </div>
      )}

      {/* Video Queue List */}
      <div className="flex flex-col divide-y divide-white/[0.05] max-h-80 overflow-y-auto pr-1 scrollbar-thin">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectActive(item.id)}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2.5 px-2 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? "bg-indigo-500/10 border border-indigo-500/30"
                  : "hover:bg-muted/20"
              }`}
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/[0.08] bg-black">
                  {item.previewThumbnailUrl ? (
                    <img
                      src={item.previewThumbnailUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Film className="h-5 w-5 text-muted-foreground" />
                  )}
                  {item.status === "completed" && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-sm">
                      {item.name}
                    </span>
                    {isActive && (
                      <Badge variant="outline" className="text-[9px] font-mono border-indigo-500/40 text-indigo-400 bg-indigo-500/10">
                        Active Tuner
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mt-0.5">
                    {item.width && item.height && (
                      <span>{item.width}×{item.height}</span>
                    )}
                    {item.durationSeconds && (
                      <span>· {item.durationSeconds.toFixed(1)}s</span>
                    )}
                    {item.totalFrames && item.status === "completed" && (
                      <span>· {item.totalFrames} frames cleaned</span>
                    )}
                  </div>

                  {/* Progress bar per item if actively processing */}
                  {item.status === "processing" && (
                    <div className="w-48 mt-1.5 flex items-center gap-2">
                      <Progress value={item.progressPercent} className="h-1 bg-muted/40" />
                      <span className="text-[10px] font-mono text-indigo-400">{item.progressPercent}%</span>
                    </div>
                  )}
                  {item.error && (
                    <span className="text-[10px] text-red-400 mt-1">{item.error}</span>
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
                    className="text-[11px] h-6 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1"
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
                  className="text-muted-foreground hover:text-red-400 h-6 w-6"
                  title="Remove from queue"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
