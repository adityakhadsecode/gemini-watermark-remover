"use client";

import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { getAssetPath } from "@/lib/utils/asset-path";

export type StudioMode = "image" | "video";

interface HeaderProps {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
}

// Crisp cross-platform SVG US Flag
function USFlag({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={`${className} rounded-[2px] overflow-hidden shrink-0 shadow-xs border border-black/10`}
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="United States Flag"
    >
      <rect width="24" height="16" fill="#B22234" />
      <path
        d="M0 2.46h24M0 4.92h24M0 7.38h24M0 9.84h24M0 12.3h24M0 14.76h24"
        stroke="#FFFFFF"
        strokeWidth="1.23"
      />
      <rect width="9.6" height="8.6" fill="#3C3B6E" />
      <circle cx="1.9" cy="1.7" r="0.6" fill="#FFFFFF" />
      <circle cx="4.8" cy="1.7" r="0.6" fill="#FFFFFF" />
      <circle cx="7.7" cy="1.7" r="0.6" fill="#FFFFFF" />
      <circle cx="3.35" cy="3.4" r="0.6" fill="#FFFFFF" />
      <circle cx="6.25" cy="3.4" r="0.6" fill="#FFFFFF" />
      <circle cx="1.9" cy="5.1" r="0.6" fill="#FFFFFF" />
      <circle cx="4.8" cy="5.1" r="0.6" fill="#FFFFFF" />
      <circle cx="7.7" cy="5.1" r="0.6" fill="#FFFFFF" />
      <circle cx="3.35" cy="6.8" r="0.6" fill="#FFFFFF" />
      <circle cx="6.25" cy="6.8" r="0.6" fill="#FFFFFF" />
    </svg>
  );
}

export function Header({ mode, onModeChange }: HeaderProps) {
  const [showBanner, setShowBanner] = useState(true);
  const [showProductsMenu, setShowProductsMenu] = useState(false);

  const scrollToStudio = () => {
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  const scrollToHowItWorks = () => {
    window.scrollTo({ top: 880, behavior: "smooth" });
  };

  return (
    <div className="w-full bg-[#f8f9eb] select-none">
      {/* Top Floating Announcement Pill Bar */}
      {showBanner && (
        <div className="w-full pt-3 px-3 sm:px-6 max-w-7xl mx-auto">
          <div className="w-full bg-[#1e1e1e] text-[#e8e9dc] rounded-[10px] px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between font-mono text-[11px] sm:text-[12px] tracking-wide uppercase">
            <div className="truncate flex-1 pr-3 text-[#dcded0]">
              <span>
                ENJOYING MARKLESS? SUPPORT THE PROJECT ON BUY ME A COFFEE.{" "}
              </span>
              <a
                href="https://buymeacoffee.com/adityakhadse"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white transition-colors cursor-pointer whitespace-nowrap ml-1"
              >
                BUY ME A COFFEE &rarr;
              </a>
            </div>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="text-[#e8e9dc]/70 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10 shrink-0 cursor-pointer"
              aria-label="Close announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4 flex items-center justify-between">
        {/* Left: Reimagined Monumental Wordmark with Subtitle */}
        <div className="flex items-center">
          <a
            href={getAssetPath("/") || "/"}
            className="group flex flex-col justify-center select-none"
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl sm:text-[32px] tracking-[-0.05em] text-[#000000] uppercase font-sans leading-none">
                Markless
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] bg-[#003d21] text-[#aafdc0] font-mono text-[9px] font-bold tracking-wider uppercase">
                V2.0
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#5a5a4f] tracking-[0.14em] uppercase font-medium mt-1">
              Watermark Remover
            </span>
          </a>
        </div>

        {/* Right Group: Navigation links + Country switcher + Submit Issue + CTA Button */}
        <div className="flex items-center gap-6 sm:gap-9">
          {/* Navigation Links (Right-aligned next to CTA, matching Coda layout) */}
          <nav className="hidden lg:flex items-center gap-7 sm:gap-8 text-[15px] font-medium text-[#1a1a1a] font-sans">
            {/* Products with studio toggle dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProductsMenu(!showProductsMenu)}
                className="hover:text-black transition-colors cursor-pointer flex items-center gap-1"
              >
                Products
                <ChevronDown className="h-3 w-3 text-[#5a5a4f] stroke-[2.5]" />
              </button>

              {showProductsMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#ffffff] border border-[#c0c2a9] rounded-[13px] py-2 z-50 shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("image");
                      setShowProductsMenu(false);
                      scrollToStudio();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                      mode === "image"
                        ? "bg-[#edeee1] font-semibold text-black"
                        : "text-[#202020] hover:bg-[#f8f9eb]"
                    }`}
                  >
                    Image Studio {mode === "image" && "✓"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange("video");
                      setShowProductsMenu(false);
                      scrollToStudio();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                      mode === "video"
                        ? "bg-[#edeee1] font-semibold text-black"
                        : "text-[#202020] hover:bg-[#f8f9eb]"
                    }`}
                  >
                    Video Studio {mode === "video" && "✓"}
                  </button>
                </div>
              )}
            </div>

            <a
              href="#approach"
              onClick={(e) => {
                e.preventDefault();
                scrollToHowItWorks();
              }}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Approach
            </a>
          </nav>

          {/* Right utility items: Flag dropdown, Submit Issue, Get Started */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Country Flag & Dropdown chevron */}
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
              <USFlag className="w-5 h-3.5" />
              <ChevronDown className="h-3 w-3 text-[#5a5a4f] stroke-[2.5]" />
            </div>

            {/* Submit Issue on GitHub link */}
            <a
              href="https://github.com/adityakhadsecode/markless/issues/new"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a1a1a] hover:text-black transition-colors font-sans"
            >
              Submit Issue
            </a>

            {/* Filled Primary CTA Button - Pill shaped */}
            <button
              type="button"
              onClick={scrollToStudio}
              className="bg-[#1c1c1c] hover:bg-black text-[#ffffff] font-medium text-[15px] px-5 sm:px-6 py-2.5 rounded-full transition-all cursor-pointer font-sans whitespace-nowrap active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
