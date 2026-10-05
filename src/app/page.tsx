"use client";

import React, { useState } from "react";
import { Header, type StudioMode } from "@/components/workspace/Header";
import { ImageStudio } from "@/components/workspace/ImageStudio";
import { VideoStudio } from "@/components/workspace/VideoStudio";
import { Footer } from "@/components/workspace/Footer";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Code2,
  CheckCircle2,
  Sliders,
  Zap,
  Image as ImageIcon,
  Video,
} from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<StudioMode>("image");

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9eb] text-[#000000] font-sans selection:bg-[#aafdc0] selection:text-[#003d21]">
      {/* Top Header with Markless Announcement Bar & Navigation */}
      <Header mode={mode} onModeChange={setMode} />

      {/* Hero Section: Centered on Cream Parchment (#f8f9eb) */}
      <section className="w-full pt-16 pb-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Monumental Display Headline: Space Grotesk 800, tight line-height 0.92, -0.01em tracking */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-[#000000] leading-[0.92] uppercase font-sans max-w-4xl">
          REMOVE WATERMARKS.
          <span className="block mt-2 text-[#202020]">
            NO BLUR
            NO ARTIFACTS
          </span>
        </h1>

        {/* Subheadline: Space Grotesk 400 at 18–21px in Charcoal (#202020) */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#5a5a4f] max-w-2xl font-sans leading-relaxed">
          100% in-browser mathematical reverse alpha blending for Google Gemini AI images and Veo videos.
          Zero cloud uploads, zero generative hallucinations, and lossless audio preservation.
        </p>
      </section>

      {/* Tactile Studio Mode Selector: Image Studio vs Video Studio */}
      <div id="workspace" className="w-full max-w-5xl mx-auto px-4 sm:px-6 mb-6 flex justify-center">
        <div className="inline-flex p-1.5 rounded-[16px] border-[1.5px] border-[#c0c2a9] bg-[#ffffff] gap-1.5">
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[11px] font-sans text-sm font-semibold transition-all cursor-pointer ${
              mode === "image"
                ? "bg-[#202020] text-[#ffffff]"
                : "text-[#5a5a4f] hover:text-[#000000] hover:bg-[#edeee1]"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Image Studio</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                mode === "image"
                  ? "bg-white/20 text-white"
                  : "bg-[#edeee1] text-[#5a5a4f]"
              }`}
            >
              Gemini
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode("video")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[11px] font-sans text-sm font-semibold transition-all cursor-pointer ${
              mode === "video"
                ? "bg-[#202020] text-[#ffffff]"
                : "text-[#5a5a4f] hover:text-[#000000] hover:bg-[#edeee1]"
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Video Studio</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                mode === "video"
                  ? "bg-white/20 text-white"
                  : "bg-[#edeee1] text-[#5a5a4f]"
              }`}
            >
              Veo
            </span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <main className="flex-1 w-full pb-16">
        {mode === "image" ? <ImageStudio /> : <VideoStudio />}
      </main>

      {/* Signature Full-Bleed Forest Section: Forest Depths (#003d21) with ~45px top corner radius */}
      <section id="approach" className="w-full bg-[#003d21] text-[#ffffff] rounded-t-[45px] pt-16 pb-20 px-6 sm:px-12 mt-12 overflow-hidden relative">
        {/* Organic 3D blob cluster decoration in Mint Sprout (#aafdc0) at 10-20% opacity */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#aafdc0] opacity-10 blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-[#aafdc0] opacity-10 blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-12 relative z-10">
          {/* Left Column: Monumental Mint Sprout Headline */}
          <div className="flex flex-col gap-4 max-w-xl">
            <span className="font-mono text-xs text-[#aafdc0] tracking-widest uppercase">
              // MATHEMATICAL PRECISION SPECIFICATION
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#aafdc0] uppercase leading-[0.98] tracking-tight font-sans">
              MATHEMATICALLY EXACT. NEVER GENERATIVE.
            </h2>
            <p className="text-sm sm:text-base text-[#ffffff]/80 leading-relaxed font-sans mt-2">
              Unlike inpainting models that invent or blur pixels, reverse alpha blending calculates the exact original pixel values by inverting the compositor blending equation:
            </p>

            <div className="mt-4 rounded-[13px] border-[1.5px] border-[#aafdc0]/30 bg-[#002916] p-4 font-mono text-xs text-[#aafdc0]">
              <div className="text-[10px] text-[#ffffff]/60 mb-1">// INVERSION FORMULA</div>
              <code>Original = clamp((Watermarked - alpha * 255) / (1 - alpha), 0, 255)</code>
            </div>
          </div>

          {/* Right Column: Mint Sprout (#aafdc0) Rounded Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:max-w-md">
            {/* Card 1 */}
            <div className="rounded-[22px] border-[1.5px] border-[#000000] bg-[#aafdc0] p-6 text-[#000000] flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[9px] border-[1.5px] border-[#000000] bg-[#ffffff] mb-4">
                  <ShieldCheck className="h-5 w-5 text-[#003d21]" />
                </div>
                <h3 className="font-bold text-base uppercase font-sans">100% Client-Side</h3>
                <p className="text-xs text-[#202020] mt-1.5 leading-normal">
                  All images and videos stay inside your local browser memory. Zero external server uploads.
                </p>
              </div>
              <span className="font-mono text-[10px] text-[#003d21] font-bold mt-4">
                DATA PRIVACY &bull; VERIFIED
              </span>
            </div>

            {/* Card 2 */}
            <div className="rounded-[22px] border-[1.5px] border-[#000000] bg-[#ffffff] p-6 text-[#000000] flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[9px] border-[1.5px] border-[#000000] bg-[#aafdc0] mb-4">
                  <Cpu className="h-5 w-5 text-[#000000]" />
                </div>
                <h3 className="font-bold text-base uppercase font-sans">Hardware WebCodecs</h3>
                <p className="text-xs text-[#5a5a4f] mt-1.5 leading-normal">
                  GPU-accelerated video frame processing with lossless audio packet copying.
                </p>
              </div>
              <span className="font-mono text-[10px] text-[#000000] font-bold mt-4">
                ZERO RE-ENCODE LOSS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pastel Feature Cards Grid: Mint Sprout, Lilac Wash, Sky Wash, Rose Wash */}
      <section className="w-full bg-[#f8f9eb] py-16 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-10">
          <Badge variant="outline" className="mb-3 font-mono text-xs">
            CORE ARCHITECTURE
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#000000]">
            TACTILE PRECISION RESTORATION
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Mint Sprout (#aafdc0) */}
          <div className="rounded-[22px] bg-[#aafdc0] p-6 text-[#003d21] flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#003d21]/70">
                MODULE 01
              </span>
              <h3 className="font-extrabold text-xl uppercase font-sans mt-2">
                3-Stage NCC Detector
              </h3>
              <p className="text-xs text-[#003d21]/80 mt-2 leading-relaxed">
                Spatial, gradient Sobel, and variance dampening cross-correlation for pinpoint watermark alignment.
              </p>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#003d21]">
              &bull; 99% CONFIDENCE
            </span>
          </div>

          {/* Card 2: Lilac Wash (#d3beff) */}
          <div className="rounded-[22px] bg-[#d3beff] p-6 text-[#2d0078] flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#2d0078]/70">
                MODULE 02
              </span>
              <h3 className="font-extrabold text-xl uppercase font-sans mt-2">
                Veo Live Tuner
              </h3>
              <p className="text-xs text-[#2d0078]/80 mt-2 leading-relaxed">
                Real-time corner magnifier with interactive gain, offset, and scale sliders before batch rendering.
              </p>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#2d0078]">
              &bull; REAL-TIME FEEDBACK
            </span>
          </div>

          {/* Card 3: Sky Wash (#b0f4ff) */}
          <div className="rounded-[22px] bg-[#b0f4ff] p-6 text-[#041668] flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#041668]/70">
                MODULE 03
              </span>
              <h3 className="font-extrabold text-xl uppercase font-sans mt-2">
                High-Throughput Batch
              </h3>
              <p className="text-xs text-[#041668]/80 mt-2 leading-relaxed">
                Parallel image worker pool with hardware core auto-detection and sequential video queues.
              </p>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#041668]">
              &bull; AUTO ZIP ARCHIVES
            </span>
          </div>

          {/* Card 4: Rose Wash (#ffc0e6) */}
          <div className="rounded-[22px] bg-[#ffc0e6] p-6 text-[#3f0929] flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f0929]/70">
                MODULE 04
              </span>
              <h3 className="font-extrabold text-xl uppercase font-sans mt-2">
                Residual Inpainting
              </h3>
              <p className="text-xs text-[#3f0929]/80 mt-2 leading-relaxed">
                Gradient-weighted Gaussian soft diffusion to polish compression artifacts on re-saved JPEGs.
              </p>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#3f0929]">
              &bull; EDGE SMOOTHING
            </span>
          </div>
        </div>
      </section>

      {/* Markless Architectural Editorial Footer */}
      <Footer onSelectStudio={setMode} />
    </div>
  );
}
