"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Clock, Layers, Sparkles } from "lucide-react";
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
          className="h-6 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[11px]"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>Restored</span>
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="h-6 gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-[11px]"
        >
          <AlertTriangle className="h-3 w-3" />
          <span>Skipped (No Watermark)</span>
        </Badge>
      )}

      {/* Profile & Resolution */}
      {dimensions && (
        <Badge variant="outline" className="h-6 border-white/[0.08] bg-muted/20 font-mono text-[11px] text-muted-foreground">
          {dimensions.width} × {dimensions.height}
        </Badge>
      )}

      {result.variant && (
        <Badge variant="outline" className="h-6 border-indigo-500/30 bg-indigo-500/10 font-mono text-[11px] text-indigo-400 gap-1">
          <Sparkles className="h-3 w-3" />
          <span>Profile: {result.variant.toUpperCase()}</span>
          {result.usedLegacyFallback && (
            <span className="text-[9px] text-amber-400">(Fallback)</span>
          )}
        </Badge>
      )}

      {/* Confidence */}
      {result.detection && (
        <Badge
          variant="outline"
          className={`h-6 border-white/[0.08] font-mono text-[11px] ${
            confPercent >= 75
              ? "text-emerald-400"
              : confPercent >= 25
              ? "text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          {confPercent}% Match
        </Badge>
      )}

      {/* Latency */}
      <Badge variant="outline" className="h-6 gap-1 border-white/[0.08] bg-muted/10 font-mono text-[11px] text-muted-foreground ml-auto">
        <Clock className="h-3 w-3" />
        <span>{result.elapsedMs.toFixed(1)} ms</span>
      </Badge>
    </div>
  );
}
