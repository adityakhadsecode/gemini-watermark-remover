"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { UploadCloud, Image as ImageIcon, Video as VideoIcon, Clipboard, FileArchive } from "lucide-react";

interface MediaDropzoneProps {
  mode: "image" | "video";
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function MediaDropzone({ mode, onFilesSelected, disabled }: MediaDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes =
    mode === "image"
      ? ["image/png", "image/jpeg", "image/webp"]
      : ["video/mp4", "video/webm", "video/quicktime"];

  const acceptedExtensions =
    mode === "image" ? ".png, .jpg, .jpeg, .webp" : ".mp4, .webm, .mov";

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const valid: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (mode === "image" && file.type.startsWith("image/")) {
          valid.push(file);
        } else if (mode === "video" && file.type.startsWith("video/")) {
          valid.push(file);
        }
      }
      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [mode, onFilesSelected],
  );

  // Global clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        handleFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled, handleFiles]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative flex min-h-[380px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-all ${
        isDragOver
          ? "border-indigo-500 bg-indigo-500/[0.04] shadow-[0_0_40px_rgba(99,102,241,0.15)]"
          : "border-white/[0.12] bg-card/40 hover:border-white/[0.25] hover:bg-card/70"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={mode === "image"}
        accept={acceptedExtensions}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Decorative center icon */}
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-muted/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        {mode === "image" ? (
          <ImageIcon className="h-8 w-8 text-indigo-400" />
        ) : (
          <VideoIcon className="h-8 w-8 text-indigo-400" />
        )}
      </div>

      {/* Main instructions */}
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        Drop {mode === "image" ? "Gemini images" : "Veo videos"} here or{" "}
        <span className="text-indigo-400 underline decoration-indigo-400/40 underline-offset-4 group-hover:decoration-indigo-400">
          browse
        </span>
      </h3>

      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
        {mode === "image"
          ? "Supports Gemini 3.5+, Legacy Gemini, and free-tier half-scale PNGs/JPEGs. Batch files and clipboard paste supported."
          : "Supports Google Veo 1080p diamond, 720p standard/compact, and Flow text watermarks. Preserves audio track."}
      </p>

      {/* Quick shortcuts / hints */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-muted/20 px-2.5 py-1">
          <Clipboard className="h-3 w-3 text-indigo-400" />
          <span>Ctrl+V / ⌘+V to paste</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-muted/20 px-2.5 py-1">
          <FileArchive className="h-3 w-3 text-muted-foreground" />
          <span>{acceptedExtensions}</span>
        </div>
        {mode === "image" && (
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-muted/20 px-2.5 py-1">
            <UploadCloud className="h-3 w-3 text-emerald-400" />
            <span>Multiple files ok</span>
          </div>
        )}
      </div>
    </div>
  );
}
