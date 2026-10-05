"use client";

import React from "react";
import {
  ShieldCheck,
  Cpu,
  Layers,
  Heart,
  ArrowUp,
  Coffee,
  Sparkles,
  ExternalLink,
} from "lucide-react";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

interface FooterProps {
  onSelectStudio?: (mode: "image" | "video") => void;
}

export function Footer({ onSelectStudio }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToWorkspace = (mode?: "image" | "video") => {
    if (mode && onSelectStudio) {
      onSelectStudio(mode);
    }
    const el = document.getElementById("workspace");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 340, behavior: "smooth" });
    }
  };

  const scrollToApproach = () => {
    const el = document.getElementById("approach");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full bg-[#f8f9eb] border-t-[1.5px] border-[#c0c2a9] pt-16 pb-12 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pre-Footer Action Banner */}
        <div className="rounded-[27px] border-[1.5px] border-[#000000] bg-[#ffffff] p-8 sm:p-12 mb-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden">
          {/* Subtle decorative mint tint in corner */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#aafdc0] opacity-20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="max-w-2xl relative z-10">
            <span className="font-mono text-xs uppercase tracking-widest text-[#003d21] font-bold">
              // ZERO COMPROMISE PRIVACY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#000000] font-sans mt-2">
              Restore Media Locally.
              <span className="block text-[#5a5a4f] text-2xl sm:text-3xl font-medium mt-1">
                Zero Cloud Uploads. Zero Artifacts.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5a5a4f] font-sans leading-relaxed">
              Mathematical reverse alpha reconstruction executed 100% inside your browser threads.
              Your high-resolution images and videos never leave your local device.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => scrollToWorkspace("image")}
              className="bg-[#202020] hover:bg-black text-[#ffffff] text-sm font-semibold px-6 py-3 rounded-[13px] transition-all cursor-pointer font-sans active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-[#aafdc0]" />
              Start Restoring
            </button>

            <a
              href="https://buymeacoffee.com/adityakhadse"
              target="_blank"
              rel="noreferrer"
              className="bg-[#ffffff] hover:bg-[#edeee1] border-[1.5px] border-[#c0c2a9] text-[#202020] text-sm font-semibold px-5 py-3 rounded-[13px] transition-all cursor-pointer font-sans flex items-center gap-2 active:scale-95"
            >
              <Coffee className="h-4 w-4 text-[#000000]" />
              Buy Me a Coffee
            </a>
          </div>
        </div>

        {/* Multi-Column Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
          {/* Brand Column (2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              {/* Logo with Sub-Badge & Subtitle */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-2xl sm:text-3xl tracking-[-0.05em] text-[#000000] uppercase font-sans leading-none">
                    Markless
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] bg-[#003d21] text-[#aafdc0] font-mono text-[9px] font-bold tracking-wider uppercase">
                    V2.0
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#5a5a4f] tracking-[0.14em] uppercase font-medium mt-1">
                  Watermark Remover
                </span>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-[#5a5a4f] font-sans leading-relaxed max-w-sm">
                Mathematically exact reverse alpha blending for Google Gemini AI images and Veo videos.
                Engineered with pure TypeScript, Float32Array masks, and hardware-accelerated WebCodecs.
              </p>
            </div>
          </div>

          {/* Column 2: Studios */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#000000] font-bold">
              // STUDIOS
            </span>
            <ul className="flex flex-col gap-2.5 text-sm font-sans text-[#5a5a4f]">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToWorkspace("image")}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Image Studio (Gemini V1 & V2)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToWorkspace("video")}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Video Studio (Veo Flow)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToWorkspace("video")}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Real-Time Corner Magnifier
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToWorkspace("image")}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Batch Multi-File Processing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToWorkspace("image")}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Residual Gaussian Inpainting
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Architecture */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#000000] font-bold">
              // ARCHITECTURE
            </span>
            <ul className="flex flex-col gap-2.5 text-sm font-sans text-[#5a5a4f]">
              <li>
                <button
                  type="button"
                  onClick={scrollToApproach}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Reverse Alpha Formula
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollToApproach}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  3-Stage NCC Detector
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollToApproach}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  WebCodecs Frame Pipeline
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={scrollToApproach}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Lossless Audio Demuxing
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/adityakhadsecode/markless#mathematical-foundation"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-black transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  Engine Documentation <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Community & Support */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#000000] font-bold">
              // PROJECT
            </span>
            <ul className="flex flex-col gap-2.5 text-sm font-sans text-[#5a5a4f]">
              <li>
                <a
                  href="https://github.com/adityakhadsecode/markless"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-black transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/adityakhadsecode/markless/issues/new"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-black transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Submit Issue / Bug
                </a>
              </li>
              <li>
                <a
                  href="https://buymeacoffee.com/adityakhadse"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-black transition-colors inline-flex items-center gap-1.5 text-[#003d21] font-semibold cursor-pointer"
                >
                  <Coffee className="h-3.5 w-3.5 text-[#003d21]" />
                  Buy Me a Coffee
                </a>
              </li>
              <li>
                <span className="text-xs text-[#7c7d76]">
                  MIT License &bull; Free Software
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature Telemetry Badges Strip */}
        <div className="border-t-[1.5px] border-[#c0c2a9] pt-6 pb-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[#5a5a4f]">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#000000] font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-[#003d21]" />
              100% In-Browser Execution
            </span>
            <span className="flex items-center gap-1.5 text-[#000000] font-medium">
              <Cpu className="h-3.5 w-3.5 text-[#000000]" />
              WebCodecs Hardware Accelerated
            </span>
            <span className="flex items-center gap-1.5 text-[#000000] font-medium">
              <Layers className="h-3.5 w-3.5 text-[#000000]" />
              Lossless Audio Passthrough
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#5a5a4f]">
            <span>ZERO CLOUD TRANSMISSION</span>
            <span>&bull;</span>
            <span>UNLIMITED FILE SIZE</span>
          </div>
        </div>

        {/* Bottom Copyright & Back-to-Top Bar */}
        <div className="border-t-[1.5px] border-[#c0c2a9] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-[#5a5a4f]">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} Markless. Crafted with</span>
            <Heart className="h-3 w-3 text-[#dc2626] fill-current" />
            <span>by</span>
            <a
              href="https://buymeacoffee.com/adityakhadse"
              target="_blank"
              rel="noreferrer"
              className="text-[#000000] font-semibold underline underline-offset-4 hover:text-[#003d21] transition-colors"
            >
              Aditya Khadse
            </a>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] border-[1.5px] border-[#c0c2a9] hover:border-[#000000] bg-white text-[#202020] text-xs font-mono font-medium transition-all cursor-pointer active:scale-95"
            aria-label="Back to top"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
