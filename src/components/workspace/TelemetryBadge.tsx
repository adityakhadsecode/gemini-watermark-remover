"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProcessResult } from "@/lib/watermark/types";

interface TelemetryBadgeProps {
  result: ProcessResult | null;
  dimensions?: { width: number; height: number } | null;
}

export function TelemetryBadge({ result, dimensions }: TelemetryBadgeProps) {
  if (!result) return null;

  const isRemoved = result.status === "removed";
  const confidence = result.detection?.confidence ?? 0;
  const confPercent = Math.round(confidence * 100);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Status Badge */}
      {isRemoved ? (
        <Badge
          variant="outline"
          className="h-7 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-[11px] px-2.5 shadow-sm"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="font-semibold">Cleaned</span>
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="h-7 gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-[11px] px-2.5"
        >
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <span>No Watermark Detected</span>
        </Badge>
      )}

      {/* Profile & Resolution */}
      {dimensions && (
        <Badge variant="outline" className="h-7 border-white/[0.08] bg-[#121520]/80 font-mono text-[11px] text-slate-300 px-2.5 shadow-sm">
          {dimensions.width} &times; {dimensions.height}
        </Badge>
      )}

      {result.variant && (
        <Badge variant="outline" className="h-7 border-indigo-500/30 bg-indigo-500/10 font-mono text-[11px] text-indigo-300 px-2.5 gap-1.5 shadow-sm">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          <span>Profile: {result.variant.toUpperCase()}</span>
          {result.usedLegacyFallback && (
            <span className="text-[10px] text-amber-300 font-bold">(Fallback)</span>
          )}
        </Badge>
      )}

      {/* Confidence */}
      {result.detection && (
        <Badge
          variant="outline"
          className={`h-7 border-white/[0.08] bg-[#121520]/80 font-mono text-[11px] px-2.5 ${
            confPercent >= 75
              ? "text-emerald-400 border-emerald-500/30"
              : confPercent >= 25
              ? "text-amber-400 border-amber-500/30"
              : "text-slate-400"
          }`}
        >
          {confPercent}% Match
        </Badge>
      )}

      {/* Latency */}
      <Badge variant="outline" className="h-7 gap-1.5 border-white/[0.08] bg-[#121520]/80 font-mono text-[11px] text-slate-300 ml-auto px-2.5">
        <Clock className="h-3 w-3 text-slate-400" />
        <span>{result.elapsedMs.toFixed(1)} ms</span>
      </Badge>
    </div>
  );
}
