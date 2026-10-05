# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| **Framework** | Next.js 14+ (App Router) + TypeScript | Modern React framework for routing, layout, and client-side rendering |
| **UI Components** | shadcn/ui (Radix UI primitives) | Accessible, customizable component primitives (dialogs, sliders, tabs, buttons, toasts) |
| **Styling** | Tailwind CSS + CSS Custom Properties | Dark industrial technical aesthetic, responsive layouts, micro-animations |
| **Icons** | Lucide React | High-clarity vector icons |
| **Image Core** | Web Workers + HTML5 Canvas / TypedArrays (`Uint8ClampedArray`) | Off-main-thread pixel-level reverse alpha blending and normalized cross-correlation |
| **Video Core** | FFmpeg.wasm (`@ffmpeg/ffmpeg` + WebAssembly hosted locally in `/public/ffmpeg/`) | Client-side video demuxing, frame manipulation, audio passthrough (`-c:a copy`), 100% offline |
| **Client Storage** | IndexedDB (idb-keyval) & Blob URLs | Transient storage for large video buffers and session history |

---

## System Boundaries

```
[ User Browser Interface (Next.js / shadcn/ui) ]
       │                                │
       ▼ (Images)                       ▼ (Videos)
[ Image Processing Worker ]       [ FFmpeg.wasm Video Pipeline ]
  ├─ Alpha Mask Calibration         ├─ Demux / Audio Track Isolation (-vn -c:a copy)
  ├─ 3-Stage NCC Detector           ├─ Frame Extraction or Direct Stream Processing
  ├─ Reverse Alpha Math             ├─ Frame Processor (NCC Probe + Adaptive Bisection)
  └─ Soft Edge Inpainting           └─ Re-encode Video & Mux Original Audio (-c:a copy)
```

- `src/lib/watermark/` — Pure algorithmic core:
  - `masks.ts`: Pre-computed `Float32Array` normalized alpha maps (36×36, 48×48, 96×96, Veo diamond, and Veo text) for zero-latency synchronous execution in Web Workers and main thread.
  - `detector.ts`: Normalized Cross-Correlation (NCC) template matcher and multi-stage confidence scoring.
  - `blender.ts`: Deterministic reverse alpha blending equation `(P_w - α·L)/(1 - α)` with zero-division safeguard and byte clamping.
  - `inpaint.ts`: Pure TypeScript gradient-weighted Gaussian blend for post-processed/recompressed images (zero extra WASM dependencies, <2ms execution, adjustable radius & strength).
- `src/lib/video/` — Video processing subsystem:
  - `demuxer.ts`: Extracting video and audio tracks without decoding audio.
  - `frame-pipeline.ts`: High-performance ROI-only pixel manipulation (processes only the ~48×48 watermark box per frame, reducing memory throughput by >99.8%).
  - `analyzer.ts`: Multi-frame probe (sampling 12 frames across video) for consensus alpha and geometry locking.
  - `temporal-filter.ts`: Adaptive bisection feedback loop (up to 5 iterations evaluating boundary visual consistency) with ±0.05 per-frame change cap, plus a user-selectable "Fast Lock" mode that pins the per-shot median alpha for 3x processing speedup.
  - `muxer.ts`: Remuxing processed video stream with bit-identical original audio into valid MP4.
- `src/lib/workers/` — Web Worker encapsulation:
  - Offloads heavy image batch processing and frame arithmetic from the browser UI thread to maintain 60 FPS responsiveness.
- `src/components/ui/` — Base shadcn/ui primitives.
- `src/components/workspace/` — Application domain components:
  - `MediaDropzone`: Drag-and-drop, clipboard paste, format validation.
  - `ComparisonView`: Interactive split-wipe slider, A/B toggle, and zoom/pan inspector.
  - `VideoScrubber`: Synchronized before/after playback and timeline scrub control.
  - `BatchQueue`: Progress bar, file thumbnails, batch download controls.
  - `TuningControls`: Manual region selector, alpha sensitivity, and inpainting radius sliders.

---

## Storage Model

- **Memory (RAM / TypedArrays)**: Primary medium for image pixel buffers, active video chunks, and alpha matrices. Disposed as soon as export or tab navigation completes.
- **Blob URLs (`blob:...`)**: Short-lived browser references for image previews and downloaded file links.
- **IndexedDB (`idb-keyval`)**: Optional local cache for preserving workspace state across accidental page refreshes without server involvement.
- **Zero Remote Storage**: The application has no external cloud storage bucket, no database, and no server endpoints.

---

## Invariants

1. **Absolute Client-Side Execution**: No image, video, audio byte, or frame shall ever be transmitted over the network. Zero server-side media processing endpoints exist.
2. **Deterministic Mathematical Correctness**:
   - Alpha inversion must adhere strictly to `Original = (Watermarked - alpha * 255) / (1 - alpha)`.
   - Alpha values with `alpha > 0.99` must be smoothly bounded or masked to prevent numerical instability and division by zero.
3. **Tick-Exact Video Timing**:
   - The output video must preserve the exact frame count, PTS/DTS timestamps, frame rate metadata, and duration of the input.
4. **Lossless Audio Passthrough**:
   - Audio tracks must be demuxed and remuxed into the output container without decoding or lossy recompression.
5. **Main Thread Responsiveness**:
   - Long-running pixel loops, multi-frame video decoding, and batch operations must execute in Web Workers or yielding chunks to avoid UI stutter or dropped frames.
