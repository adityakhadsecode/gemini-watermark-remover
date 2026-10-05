"use client";

import React from "react";
import { Sliders, Sparkles, Wand2, ShieldAlert, RotateCcw } from "lucide-react";
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
  detectedConfidence,
  detectedVariant,
  isProcessing,
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
    <div className="flex flex-col gap-5 rounded-xl border border-white/[0.08] bg-card p-4 sm:p-5 shadow-sm text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-foreground">Restoration Tuning</span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground h-6"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset Defaults
        </Button>
      </div>

      {/* 1. Profile Mode Selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Watermark Profile</label>
          {detectedVariant && (
            <Badge variant="outline" className="font-mono text-[10px] text-indigo-400 border-indigo-500/30">
              Matched: {detectedVariant.toUpperCase()}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-white/[0.08] bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => setProfile("auto")}
            className={`rounded-md py-1.5 text-xs font-medium transition-all ${
              options.profile === "auto"
                ? "bg-card text-foreground shadow-sm border border-white/[0.08]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Auto Detect
          </button>
          <button
            type="button"
            onClick={() => setProfile("v2")}
            className={`rounded-md py-1.5 text-xs font-medium transition-all ${
              options.profile === "v2"
                ? "bg-card text-foreground shadow-sm border border-white/[0.08]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Gemini 3.5+
          </button>
          <button
            type="button"
            onClick={() => setProfile("v1")}
            className={`rounded-md py-1.5 text-xs font-medium transition-all ${
              options.profile === "v1"
                ? "bg-card text-foreground shadow-sm border border-white/[0.08]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Legacy (V1)
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
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
          <label className="text-xs font-medium text-foreground">Confidence Threshold</label>
          <span className="font-mono text-xs text-muted-foreground">
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
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
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
            className="rounded border-white/[0.2] bg-muted/30 text-indigo-500 focus:ring-indigo-500/20"
          />
          <span className="text-xs text-foreground">Force removal even if detection confidence is low</span>
        </label>
      </div>

      {/* 3. Soft Inpainting (Residual Edge Smoothing) */}
      <div className="flex flex-col gap-3 rounded-lg border border-white/[0.08] bg-muted/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-foreground">Residual Edge Smoothing</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(options.softInpaint)}
            onChange={(e) => toggleInpaint(e.target.checked)}
            className="rounded border-white/[0.2] bg-muted/30 text-indigo-500 focus:ring-indigo-500/20"
          />
        </div>

        {options.softInpaint ? (
          <div className="flex flex-col gap-3 pt-1">
            <p className="text-[11px] text-muted-foreground">
              Soft gradient blend to clean residual sparkle halos on lossy compressed or resized images.
            </p>

            {/* Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Smoothing Strength</span>
                <span className="font-mono text-[11px] text-foreground">
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Filter Radius</span>
                <span className="font-mono text-[11px] text-foreground">
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
          <p className="text-[11px] text-muted-foreground">
            Optional. Enable if the processed image leaves faint residual watermark edges from JPEG compression.
          </p>
        )}
      </div>
    </div>
  );
}
