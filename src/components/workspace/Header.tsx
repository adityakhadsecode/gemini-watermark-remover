"use client";

import React from "react";
import { Sparkles, Video, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type StudioMode = "image" | "video";

interface HeaderProps {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-sm text-foreground">
                Gemini & Veo
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Watermark Remover
              </span>
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1 hidden md:flex"
              >
                <ShieldCheck className="h-3 w-3" />
                100% Client-Side
              </Badge>
            </div>
          </div>
        </div>

        {/* Studio Mode Segmented Switcher */}
        <div className="flex items-center rounded-lg border border-white/[0.08] bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => onModeChange("image")}
            className={`flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              mode === "image"
                ? "bg-card text-foreground shadow-sm border border-white/[0.08]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Image Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange("video")}
            className={`flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              mode === "video"
                ? "bg-card text-foreground shadow-sm border border-white/[0.08]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Video Studio</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1">
              Veo
            </span>
          </button>
        </div>

        {/* Reference & GitHub Link */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/allenk/GeminiWatermarkTool"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
            title="Based on allenk/GeminiWatermarkTool reverse alpha blending"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden sm:inline font-mono text-[11px]">allenk/GWT</span>
          </a>
        </div>
      </div>
    </header>
  );
}
