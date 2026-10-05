"use client";

import React from "react";
import { Sliders, Wand2, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProcessOptions, ProfileMode } from "@/lib/watermark/types";

interface TuningDrawerProps {
  options: ProcessOptions;
  onChange: (options: ProcessOptions) => void;
  onReset: () => void;
  detectedConfidence?: number;
  detectedVariant?: string;
  isProcessing?: boolean;
}

export function TuningDrawer({
  options,
  onChange,
  onReset,
  detectedVariant,
}: TuningDrawerProps) {
  const setProfile = (profile: ProfileMode) => {
    onChange({ ...options, profile });
  };

  const toNumber = (val: number | readonly number[]): number => {
    return Array.isArray(val) ? val[0] : typeof val === "number" ? val : 0;
  };

  const setThreshold = (val: number | readonly number[]) => {
    onChange({ ...options, threshold: toNumber(val) });
  };

  const setForce = (force: boolean) => {
    onChange({ ...options, force });
  };

  const toggleInpaint = (enabled: boolean) => {
    onChange({
      ...options,
      softInpaint: enabled ? { strength: 0.85, radius: 10 } : null,
    });
  };

  const setInpaintStrength = (val: number | readonly number[]) => {
    if (!options.softInpaint) return;
    onChange({
      ...options,
      softInpaint: { ...options.softInpaint, strength: toNumber(val) },
    });
  };

  const setInpaintRadius = (val: number | readonly number[]) => {
    if (!options.softInpaint) return;
    onChange({
      ...options,
      softInpaint: { ...options.softInpaint, radius: Math.round(toNumber(val)) },
    });
  };

  return (
    <div className="flex flex-col gap-5 rounded-[22px] border-[1.5px] border-[#000000] bg-[#ffffff] p-5 text-sm font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b-[1.5px] border-[#c0c2a9] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] border-[1.5px] border-[#000000] bg-[#aafdc0] text-[#000000]">
            <Sliders className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-base text-[#000000] tracking-tight uppercase">
            Restoration Tuning
          </span>
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={onReset}
          className="text-xs text-[#5a5a4f] hover:text-[#000000] h-7 font-mono"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset Defaults
        </Button>
      </div>

      {/* 1. Profile Mode Selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#000000] uppercase tracking-wider font-mono">
            Watermark Profile
          </label>
          {detectedVariant && (
            <Badge variant="outline" className="font-mono text-[10px] bg-[#edeee1] text-[#000000] border-[#c0c2a9]">
              Matched: {detectedVariant.toUpperCase()}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-[13px] border-[1.5px] border-[#c0c2a9] bg-[#edeee1] p-1">
          <button
            type="button"
            onClick={() => setProfile("auto")}
            className={`rounded-[9px] py-1.5 text-xs font-semibold transition-all ${
              options.profile === "auto"
                ? "bg-[#202020] text-[#ffffff]"
                : "text-[#5a5a4f] hover:text-[#000000]"
            }`}
          >
            Auto Detect
          </button>
          <button
            type="button"
            onClick={() => setProfile("v2")}
            className={`rounded-[9px] py-1.5 text-xs font-semibold transition-all ${
              options.profile === "v2"
                ? "bg-[#202020] text-[#ffffff]"
                : "text-[#5a5a4f] hover:text-[#000000]"
            }`}
          >
            Gemini 3.5+
          </button>
          <button
            type="button"
            onClick={() => setProfile("v1")}
            className={`rounded-[9px] py-1.5 text-xs font-semibold transition-all ${
              options.profile === "v1"
                ? "bg-[#202020] text-[#ffffff]"
                : "text-[#5a5a4f] hover:text-[#000000]"
            }`}
          >
            Legacy (V1)
          </button>
        </div>
        <p className="text-[11px] text-[#5a5a4f] leading-normal font-sans">
          {options.profile === "auto"
            ? "Tries current Gemini 3.5+ profile first; automatically falls back to legacy V1 if skipped."
            : options.profile === "v2"
            ? "Locks Gemini 3.5+ profile (36×36 small, 96×96 large, 192 margin)."
            : "Locks pre-Gemini 3.5 legacy profile (48×48 small, 96×96 large, 32/64 margin)."}
        </p>
      </div>

      {/* 2. Detection Sensitivity Threshold */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#000000] uppercase tracking-wider font-mono">
            Confidence Threshold
          </label>
          <span className="font-mono text-xs font-bold text-[#000000]">
            {(options.threshold * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          value={[options.threshold]}
          min={0.1}
          max={0.8}
          step={0.05}
          onValueChange={setThreshold}
          className="my-1"
        />
        <div className="flex items-center justify-between text-[10px] text-[#5a5a4f] font-mono">
          <span>10% (Sensitive)</span>
          <span>Default: 25%</span>
          <span>80% (Strict)</span>
        </div>

        {/* Force Removal Checkbox */}
        <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.force}
            onChange={(e) => setForce(e.target.checked)}
            className="h-4 w-4 rounded-[4px] border-[1.5px] border-[#000000] accent-[#202020] cursor-pointer"
          />
          <span className="text-xs font-medium text-[#202020]">
            Force removal even if detection confidence is low
          </span>
        </label>
      </div>

      {/* 3. Soft Inpainting (Residual Edge Smoothing) Pastel Card */}
      <div className="flex flex-col gap-3 rounded-[13px] border-[1.5px] border-[#c0c2a9] bg-[#edeee1] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-[#000000]" />
            <span className="text-xs font-bold text-[#000000] uppercase font-mono">
              Residual Edge Smoothing
            </span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(options.softInpaint)}
            onChange={(e) => toggleInpaint(e.target.checked)}
            className="h-4 w-4 rounded-[4px] border-[1.5px] border-[#000000] accent-[#202020] cursor-pointer"
          />
        </div>

        {options.softInpaint ? (
          <div className="flex flex-col gap-3 pt-1 border-t border-[#c0c2a9]/60">
            <p className="text-[11px] text-[#5a5a4f]">
              Soft gradient blend to clean residual sparkle halos on lossy compressed or resized images.
            </p>

            {/* Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#5a5a4f]">Smoothing Strength</span>
                <span className="font-bold text-[#000000]">
                  {(options.softInpaint.strength * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[options.softInpaint.strength]}
                min={0.1}
                max={1.0}
                step={0.05}
                onValueChange={setInpaintStrength}
              />
            </div>

            {/* Radius */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#5a5a4f]">Filter Radius</span>
                <span className="font-bold text-[#000000]">
                  {options.softInpaint.radius} px
                </span>
              </div>
              <Slider
                value={[options.softInpaint.radius]}
                min={2}
                max={20}
                step={1}
                onValueChange={setInpaintRadius}
              />
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-[#5a5a4f]">
            Optional. Enable if the processed image leaves faint residual watermark edges from lossy JPEG compression.
          </p>
        )}
      </div>
    </div>
  );
}
