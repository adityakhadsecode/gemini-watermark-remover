"use client";

import React from "react";
import { Video, Image as ImageIcon, Sparkles, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type StudioMode = "image" | "video";

interface HeaderProps {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <div className="w-full flex flex-col">
      {/* Coda Announcement Bar: Charcoal (#202020) slim strip */}
      <div className="w-full bg-[#202020] text-[#f8f9eb] py-2 px-4 text-center font-mono text-[11px] tracking-wider uppercase border-b border-[#000000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline opacity-70">
            SYSTEM // ZERO-SERVER IN-BROWSER RESTORATION
          </span>
          <span className="mx-auto sm:mx-0 font-medium">
            100% Client-Side Reverse Alpha Blending &bull; Mathematically Exact &bull; Private
          </span>
          <span className="hidden sm:inline font-mono opacity-70">
            BUILD 2026.1
          </span>
        </div>
      </div>

      {/* Main Top Navigation: Cream Parchment (#f8f9eb) */}
      <header className="w-full border-b-[1.5px] border-[#c0c2a9] bg-[#f8f9eb]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3">
            {/* Inline Icon Glyph container: 42x42 rounded square with black border */}
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] border-[1.5px] border-[#000000] bg-[#aafdc0] text-[#000000]">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-[#000000] uppercase font-sans">
                  GEMINI & VEO
                </span>
                <Badge variant="outline" className="hidden md:inline-flex text-[10px] py-0 px-2 h-5">
                  RESTORATION
                </Badge>
              </div>
              <span className="text-[11px] text-[#5a5a4f] -mt-1 font-mono">
                Reverse Alpha Engine
              </span>
            </div>
          </div>

          {/* Studio Mode Switcher: 13px radius buttons on Bone border */}
          <div className="flex items-center rounded-[13px] border-[1.5px] border-[#c0c2a9] bg-[#edeee1] p-1">
            <button
              type="button"
              onClick={() => onModeChange("image")}
              className={`flex items-center gap-2 rounded-[9px] px-3.5 py-1.5 text-xs font-medium transition-all ${
                mode === "image"
                  ? "bg-[#202020] text-[#ffffff] shadow-none"
                  : "text-[#5a5a4f] hover:text-[#000000]"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Image Studio</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange("video")}
              className={`flex items-center gap-2 rounded-[9px] px-3.5 py-1.5 text-xs font-medium transition-all ${
                mode === "video"
                  ? "bg-[#202020] text-[#ffffff] shadow-none"
                  : "text-[#5a5a4f] hover:text-[#000000]"
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span>Video Studio</span>
            </button>
          </div>

          {/* GitHub Outlined Ghost Link */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/adityakhadsecode/gemini-watermark-remover"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#202020] hover:text-[#000000] transition-colors px-3 py-1.5 rounded-[9px] border-[1.5px] border-[#c0c2a9] hover:bg-[#edeee1] font-mono"
              title="View source on GitHub"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>
    </div>
  );
}
