"use client";

import React, { useState } from "react";
import { Header, type StudioMode } from "@/components/workspace/Header";
import { ImageStudio } from "@/components/workspace/ImageStudio";
import { VideoStudio } from "@/components/workspace/VideoStudio";
import { ShieldCheck, Cpu, Layers } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<StudioMode>("image");

  return (
    <div className="relative flex min-h-screen flex-col bg-[#08090d] text-foreground selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-indigo-500/10 via-indigo-500/3 to-transparent blur-[120px]" />
        <div className="absolute top-1/4 -right-40 h-[400px] w-[500px] rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute top-2/3 -left-40 h-[400px] w-[500px] rounded-full bg-purple-500/5 blur-[100px]" />
        <div className="absolute inset-0 bg-grid-dots opacity-30" />
      </div>

      {/* Top Studio Header */}
      <Header mode={mode} onModeChange={setMode} />

      {/* Main Studio Viewport */}
      <main className="relative z-10 flex-1 flex flex-col justify-start">
        {mode === "image" ? <ImageStudio /> : <VideoStudio />}
      </main>

      {/* Industrial Footer & Technical Guarantee */}
      <footer className="relative z-10 w-full border-t border-white/[0.07] bg-[#090b10]/90 backdrop-blur-md py-6 text-xs text-muted-foreground mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-6 text-[11px] font-mono">
            <span className="flex items-center gap-2 text-foreground/90 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              100% Client-Side In-Browser
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

          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <span>Client-Side Reconstruction</span>
            <span>&bull;</span>
            <span>Zero Quality Loss</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
