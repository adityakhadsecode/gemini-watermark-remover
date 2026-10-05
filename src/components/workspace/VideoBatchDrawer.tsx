"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Download,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
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
  onAddVideos?: (files: File[]) => void;
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
    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-5 shadow-2xl border border-white/[0.08]">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp4, .webm, .mov"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground">
                Veo Video Queue
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/30 text-cyan-300 bg-cyan-500/10 px-2 py-0.5">
                {completedCount}/{items.length} Ready
              </Badge>
              {inProgressItem && (
                <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-300 bg-indigo-500/10 gap-1.5 px-2 py-0.5 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing: {inProgressItem.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onAddVideos && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="btn-press text-[11px] h-7 border-dashed border-white/[0.18] hover:border-cyan-400 hover:text-cyan-300 gap-1.5 px-2.5"
            >
              <Plus className="h-3 w-3" />
              Add More Videos
            </Button>
          )}

          <Button
            variant="outline"
            size="xs"
            onClick={onClearAll}
            disabled={isProcessing}
            className="btn-press text-[11px] h-7 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] px-2.5"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Queue
          </Button>

          {pendingCount > 0 && (
            <Button
              variant="default"
              size="xs"
              onClick={onProcessAll}
              disabled={isProcessing}
              className="btn-press text-[11px] h-7 bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-[0_0_20px_rgba(99,102,241,0.25)] font-semibold px-3"
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
              className="btn-press text-[11px] h-7 gap-1.5 shadow-sm font-semibold px-3"
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
          <Progress value={overallPercent} className="h-1.5 bg-white/[0.06]" />
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
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 px-3 rounded-xl cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-indigo-500/[0.12] border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                  : "hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex h-14 w-22 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.1] bg-black shadow-md">
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
                    <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center backdrop-blur-[1px]">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 drop-shadow" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground truncate max-w-xs sm:max-w-sm">
                      {item.name}
                    </span>
                    {isActive && (
                      <Badge variant="outline" className="text-[9px] font-mono border-indigo-500/50 text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2">
                        Active Tuner
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mt-0.5">
                    {item.width && item.height && (
                      <span>{item.width} &times; {item.height}</span>
                    )}
                    {item.durationSeconds && (
                      <span>&bull; {item.durationSeconds.toFixed(1)}s</span>
                    )}
                    {item.totalFrames && item.status === "completed" && (
                      <span className="text-emerald-400">&bull; {item.totalFrames} frames cleaned</span>
                    )}
                  </div>

                  {/* Progress bar per item if actively processing */}
                  {item.status === "processing" && (
                    <div className="w-48 mt-1.5 flex items-center gap-2">
                      <Progress value={item.progressPercent} className="h-1 bg-white/[0.1]" />
                      <span className="text-[10px] font-mono text-indigo-300 font-bold">{item.progressPercent}%</span>
                    </div>
                  )}
                  {item.error && (
                    <span className="text-[10px] text-red-400 font-mono mt-1">{item.error}</span>
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
                    className="btn-press text-[11px] h-7 text-emerald-300 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 gap-1.5 font-semibold px-2.5 shadow-sm"
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
                  className="btn-press text-muted-foreground hover:text-red-400 hover:bg-white/[0.04] h-7 w-7"
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
