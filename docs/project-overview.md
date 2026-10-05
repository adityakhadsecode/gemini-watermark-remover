# Gemini & Veo Watermark Remover — Project Overview

## Overview

A 100% client-side web application built with Next.js, shadcn/ui, and Tailwind CSS that removes Google Gemini AI visible watermarks from images and Google Veo visible watermarks from videos. 

Unlike destructive generative AI inpainting tools that hallucinate content or blur details, this application performs **mathematically exact reverse alpha blending** directly inside the user's browser. No images or videos are ever uploaded to an external server, ensuring zero bandwidth delay, complete user privacy, and instant local processing.

The restoration and detection algorithms utilize mathematical reverse alpha blending, multi-stage NCC detection, and adaptive bisection.

---

## Goals

1. **Deterministic Restoration**: Exact mathematical pixel reconstruction (`Original = (Watermarked - alpha * 255) / (1 - alpha)`) with zero cloud dependencies or generative hallucinations.
2. **Comprehensive Format Support**:
   - **Images**: Gemini 3.5+ (V2 profile: 36×36, 48×48 half-scale, 96×96 large) and Legacy Gemini (V1 profile: 48×48 small, 96×96 large).
   - **Videos**: Veo 1080p (diamond logo), Veo 720p standard (48×48) & compact (44×44), and Flow "Veo" text wordmarks.
3. **100% Client-Side Architecture**: Zero server GPU/compute costs, zero upload waiting times, and total data privacy.
4. **World-Class Industrial UI**: Built with shadcn/ui, Tailwind CSS, Lucide icons, and curated design aesthetics (dark technical workspace, drag-and-drop zones, before/after split sliders, timeline scrubber for video, and batch queue).

---

## Core User Flows

### Image Restoration Flow
1. User drops one or multiple images onto the upload zone (or pastes from clipboard).
2. App reads image data locally into memory (OffscreenCanvas / Web Worker).
3. Auto-detector runs Normalized Cross-Correlation (NCC) against calibrated V2 (and fallback V1) alpha masks to locate watermark coordinates and opacity.
4. User sees instant side-by-side or interactive split-slider before/after preview.
5. User can fine-tune: manual region selection, strength, and optional residual smoothing (Gaussian/Soft Inpainting).
6. User downloads restored lossless PNG/JPEG individually or as a ZIP archive.

### Video Restoration Flow
1. User drags & drops a Veo video file (.mp4, .webm).
2. Video demuxer extracts metadata, video stream frames, and audio track locally.
3. Multi-frame probe analyzes candidate frames to identify watermark variant, coordinates, and consensus alpha baseline.
4. Client-side pipeline processes video frames via WebCodecs / Web Worker:
   - Evaluates frame with adaptive bisection feedback loop (clamped to ±0.05 per-frame change cap to prevent flickering).
   - Inverts watermark overlay on canvas/typed arrays.
5. Re-encodes cleaned video frames and remuxes the original untouched audio stream.
6. User previews the cleaned video with a synchronized before/after scrubber and downloads the MP4.

---

## Features

### Image Engine
- **V2 Profile Support (Gemini 3.5+)**:
  - Large (canonical 2752×1536+, 96×96 logo, 192px margin).
  - Small (1024-class outputs ~36×36 logo, aspect-ratio-scaled margin).
  - Free-tier / API half-scale outputs (1376×768 class with 48×48 logo).
- **V1 Legacy Profile Support**:
  - Pre-3.5 Gemini outputs (48×48 small at 32px margin, 96×96 large at 64px margin).
- **Auto-Detection & Fallback**:
  - 3-stage NCC confidence test. Automatically probes V2 first, falls back to V1 if confidence is below threshold.
- **Interactive Manual Override**:
  - Draw custom bounding box / region with snap-to-logo assistance.
- **Batch Processing**:
  - Multi-file drop queue with concurrent Web Worker processing and progress indicators.

### Video Engine
- **Veo Watermark Variants**:
  - 1080p Landscape (1920×1080) and Portrait (1080×1920) diamond logos.
  - 720p Standard (48×48 @ 72,72 margin) and Compact (44×44 @ 29,40 margin).
  - Google Flow "Veo" text wordmark (720p & 1080p).
- **Multi-Frame Detection Probe**:
  - Probes multiple frames across the video to avoid intro fade-in / splash false negatives.
- **Temporal Consistency & Anti-Flicker**:
  - Bisection feedback loop anchored to per-shot consensus median with delta caps (±0.05).
- **Lossless Audio Passthrough**:
  - Audio packets pass directly from input to output container without lossy re-encoding.

### User Interface & Experience
- **Sleek Technical Aesthetic**: Obsidian/slate theme, subtle micro-borders, mono-spaced telemetry, glassmorphic floating bars.
- **Interactive Comparison**: Split wipe slider, toggle view (A/B), and zoom/pan inspection.
- **Video Scrubbing**: Real-time side-by-side or split scrubber on scrubbed frames.

---

## Scope

### In Scope
- Next.js (App Router) client-rendered processing shell.
- Pure client-side image processing (Canvas2D / TypedArrays / Web Workers).
- Pure client-side video frame decoding, reverse blending, and encoding (WebCodecs + MP4Box.js / FFmpeg WASM fallback).
- Calibrated embedded alpha maps.
- Soft residual inpainting (Gaussian / continuous gradient mask).
- Batch image exports and zip bundling.

### Out of Scope
- Server-side image/video processing (no backend compute or GPU infrastructure).
- Generative AI inpainting (e.g. Stable Diffusion / LaMa hallucination of completely missing areas).
- Invisible watermark removal (e.g., SynthID cryptographic watermarks or C2PA metadata tampering).

---

## Success Criteria

1. **Restoration Quality**: Cleans 1080p/720p Gemini 3.5 images and Veo videos with visual parity to the C++ reference tool.
2. **Speed & Efficiency**: Single image processed in under 100ms; video processing achieves real-time or near-real-time throughput in modern browsers.
3. **Zero Data Leakage**: All computation occurs strictly in the browser; network tab verifies zero media uploads.
4. **Polished Experience**: Responsive shadcn/ui layout with fluid drag-and-drop, visual progress telemetry, and clear error diagnostics.
