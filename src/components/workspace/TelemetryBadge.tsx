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
    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
      {/* Status Badge */}
      {isRemoved ? (
        <Badge
          variant="outline"
          className="border-[1.5px] border-[#003d21]/30 bg-[#aafdc0] text-[#003d21] font-semibold"
        >
          <CheckCircle2 className="h-3 w-3 text-[#003d21]" />
          <span>Restored Exact</span>
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="border-[1.5px] border-[#c0c2a9] bg-[#ffc0e6] text-[#3f0929] font-medium"
        >
          <AlertTriangle className="h-3 w-3" />
          <span>Skipped (No Watermark)</span>
        </Badge>
      )}

      {/* Profile & Resolution */}
      {dimensions && (
        <Badge variant="outline" className="border-[1.5px] border-[#c0c2a9] bg-[#edeee1] text-[#202020]">
          {dimensions.width} × {dimensions.height}
        </Badge>
      )}

      {result.variant && (
        <Badge variant="outline" className="border-[1.5px] border-[#c0c2a9] bg-[#ffffff] text-[#000000] gap-1">
          <Sparkles className="h-3 w-3 text-[#000000]" />
          <span>PROFILE: {result.variant.toUpperCase()}</span>
          {result.usedLegacyFallback && (
            <span className="text-[9px] text-[#5a5a4f]">(Fallback)</span>
          )}
        </Badge>
      )}

      {/* Confidence */}
      {result.detection && (
        <Badge
          variant="outline"
          className="border-[1.5px] border-[#c0c2a9] bg-[#ffffff] text-[#202020]"
        >
          {confPercent}% Match
        </Badge>
      )}

      {/* Latency */}
      <Badge variant="outline" className="border-[1.5px] border-[#c0c2a9] bg-[#edeee1] text-[#5a5a4f] ml-auto">
        <Clock className="h-3 w-3" />
        <span>{result.elapsedMs.toFixed(1)} ms</span>
      </Badge>
    </div>
  );
}
