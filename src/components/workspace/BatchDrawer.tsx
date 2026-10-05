"use client";

import React, { useState, useRef } from "react";
import { Download, FileArchive, CheckCircle2, AlertTriangle, Loader2, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import JSZip from "jszip";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (items.length === 0) return null;

  const completedCount = items.filter((i) => i.status === "completed" || i.status === "skipped").length;
  const inProgressCount = items.filter((i) => i.status === "processing").length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const downloadAllAsZip = async () => {
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
    } finally {
      setIsZipping(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onAddFiles) {
      const files = Array.from(e.target.files);
      onAddFiles(files);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-card p-4 shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png, .jpg, .jpeg, .webp"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drawer Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileArchive className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-xs text-foreground">
            Image Batch Queue ({completedCount}/{items.length} Ready)
          </span>
          {inProgressCount > 0 && (
            <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-400 bg-indigo-500/10 gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              {inProgressCount} parallel workers active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onAddFiles && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] h-6 border-dashed border-white/[0.2] hover:border-indigo-400 hover:text-indigo-300 gap-1"
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
            className="text-[11px] h-6 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>

          <Button
            variant="default"
            size="xs"
            disabled={isZipping || completedCount === 0}
            onClick={downloadAllAsZip}
            className="text-[11px] h-6 bg-indigo-600 hover:bg-indigo-500 text-white gap-1 shadow-sm"
          >
            {isZipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Export All ZIP
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {completedCount < items.length && (
        <div className="flex flex-col gap-1">
          <Progress value={progressPercent} className="h-1.5 bg-muted/40" />
        </div>
      )}

      {/* Thumbnail Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={item.id}
              onClick={() => onSelectIndex(idx)}
              className={`group relative flex h-20 w-20 flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border transition-all ${
                isActive
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                  : "border-white/[0.08] bg-muted/20 hover:border-white/[0.2]"
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
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 bg-black/70 rounded-full" />
                )}
                {item.status === "skipped" && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 bg-black/70 rounded-full" />
                )}
                {item.status === "processing" && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400 bg-black/70 rounded-full" />
                )}

                {/* Remove button on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 hover:bg-red-500/80 text-white rounded p-0.5"
                  title="Remove item"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Filename bottom gradient */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1">
                <p className="truncate text-[9px] font-mono text-white/90">
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
