"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { UploadCloud, Image as ImageIcon, Video as VideoIcon, Clipboard, Sparkles, Layers } from "lucide-react";

interface MediaDropzoneProps {
  mode: "image" | "video";
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function MediaDropzone({ mode, onFilesSelected, disabled }: MediaDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      className={`group relative flex min-h-[420px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 bg-grid-dots ${
        isDragOver
          ? "border-indigo-400 bg-indigo-500/[0.08] shadow-[0_0_60px_rgba(99,102,241,0.25)] scale-[1.005]"
          : "border-white/[0.10] bg-[#0c0f17]/60 hover:border-indigo-400/50 hover:bg-[#0f131f]/80 shadow-2xl"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={true}
        accept={acceptedExtensions}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Ambient background glow inside dropzone */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-indigo-500/10 blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-500" />

      {/* Decorative center icon card */}
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_8px_24px_rgba(0,0,0,0.4)] group-hover:scale-105 group-hover:border-indigo-500/40 transition-all duration-300">
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        {mode === "image" ? (
          <ImageIcon className="h-9 w-9 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
        ) : (
          <VideoIcon className="h-9 w-9 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        )}
      </div>

      {/* Main instructions */}
      <h3 className="text-xl font-bold tracking-tight text-foreground">
        Drop {mode === "image" ? "Gemini images" : "Veo videos"} here or{" "}
        <span className="text-indigo-400 underline decoration-indigo-400/40 underline-offset-4 group-hover:decoration-indigo-400 transition-all">
          browse files
        </span>
      </h3>

      <p className="mt-2 text-xs text-muted-foreground/90 max-w-md leading-relaxed">
        {mode === "image"
          ? "Mathematically reconstruct original pixels for Gemini 3.5+ and Legacy watermarks with zero quality degradation."
          : "Clean Veo watermarks with hardware WebCodecs frame acceleration, live interactive corner tuning, and lossless audio passthrough."}
      </p>

      {/* Format pills */}
      <div className="mt-5 flex items-center gap-2">
        {(mode === "image" ? ["PNG", "JPEG", "WEBP", "Lossless"] : ["MP4", "WEBM", "MOV", "4K Ready"]).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300 shadow-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Quick shortcuts / hints */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#121622]/80 px-3 py-1 shadow-sm">
          <Clipboard className="h-3 w-3 text-indigo-400" />
          <span>Ctrl+V / ⌘+V paste</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#121622]/80 px-3 py-1 shadow-sm">
          <Layers className="h-3 w-3 text-cyan-400" />
          <span>Batch files supported</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#121622]/80 px-3 py-1 shadow-sm">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>100% In-Browser</span>
        </div>
      </div>
    </div>
  );
}
