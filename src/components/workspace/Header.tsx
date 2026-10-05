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
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#08090d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-indigo-500/20 to-indigo-500/5 border border-indigo-500/30 text-indigo-300 shadow-[0_0_16px_rgba(99,102,241,0.2)]">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
            <div className="absolute -inset-0.5 rounded-xl bg-indigo-500/20 blur-sm -z-10" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm text-foreground">
                Gemini &amp; Veo
              </span>
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                Watermark Remover
              </span>
              <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Private &bull; In-Browser</span>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Mode Segmented Switcher */}
        <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#0d1017]/90 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => onModeChange("image")}
            className={`btn-press flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              mode === "image"
                ? "bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-white shadow-sm border border-white/[0.12]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Image Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange("video")}
            className={`btn-press flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              mode === "video"
                ? "bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-white shadow-sm border border-white/[0.12]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
            }`}
          >
            <Video className="h-3.5 w-3.5 text-cyan-400" />
            <span>Video Studio</span>
            <span className="text-[10px] font-mono tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded px-1.5 py-0.2">
              Veo
            </span>
          </button>
        </div>

        {/* Reference & GitHub Link */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/adityakhadsecode/gemini-watermark-remover"
            target="_blank"
            rel="noreferrer"
            className="btn-press flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.15]"
            title="View source repository on GitHub"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden sm:inline text-[11px] font-mono">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
