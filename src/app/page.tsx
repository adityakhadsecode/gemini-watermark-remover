"use client";

import React, { useState } from "react";
import { Header, type StudioMode } from "@/components/workspace/Header";
import { ImageStudio } from "@/components/workspace/ImageStudio";
import { VideoStudio } from "@/components/workspace/VideoStudio";
import { ShieldCheck, Cpu, Sparkles, Layers } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<StudioMode>("image");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Studio Header */}
      <Header mode={mode} onModeChange={setMode} />

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col justify-start">
        {mode === "image" ? <ImageStudio /> : <VideoStudio />}
      </main>

      {/* Industrial Footer & Technical Guarantee */}
      <footer className="w-full border-t border-white/[0.08] bg-muted/10 py-6 text-xs text-muted-foreground mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-6 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-foreground/80">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Zero Server Uploads (100% In-Browser)
            </span>
            <span className="flex items-center gap-1.5 text-foreground/80">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              Reverse Alpha Blending Engine
            </span>
            <span className="flex items-center gap-1.5 text-foreground/80">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              Lossless Audio Passthrough
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>
              Reverse engineering & alpha masks derived from{" "}
              <a
                href="https://github.com/allenk/GeminiWatermarkTool"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                allenk
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
