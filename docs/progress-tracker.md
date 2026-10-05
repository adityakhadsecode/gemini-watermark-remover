# Progress Tracker

## Current Phase

- **Phase 4: Polish, Testing & Deployment Readiness** (Complete)

---

## Current Goal

- All core functional features (Image Studio, Video Studio, reverse alpha blending engine, offline FFmpeg WASM, shadcn/ui workspace, batch ZIP export) are implemented, verified with end-to-end unit tests, and production build succeeded with zero errors.

---

## Completed

- [x] Analyzed image watermark specifications:
  - Calibrated alpha masks for V1 (legacy) and V2 (Gemini 3.5+).
  - Reverse alpha blending formula: `Original = clamp((Watermarked - alpha * 255) / (1 - alpha), 0, 255)`.
  - Aspect-ratio-aware coordinate calculations and half-scale free-tier support.
- [x] Analyzed video watermark specifications:
  - 1080p landscape/portrait and 720p standard (48×48) / compact (44×44) diamond variants.
  - Flow "Veo" wordmark removal.
  - Multi-frame probe logic and adaptive bisection loop with ±0.05 per-frame change cap.
- [x] Installed `Leonxlnx/taste-skill` design skills into workspace (`.agents/skills/`).
- [x] Drafted complete project documentation in `docs/`:
  - `project-overview.md` (Product definition, scope, success criteria)
  - `architecture.md` (Client-side boundaries, storage, Web Workers, invariants)
  - `ui-context.md` & `ui-docs.md` (Theme, design tokens, typography, shadcn/ui components)
  - `code-standards.md` (Math safety, memory management, TypeScript standards)
  - `ai-workflow-rules.md` (Spec-driven workflow, verification criteria)
  - `AGENTS.md` (Synchronized reading order and rule set)
- [x] Resolved all design branches via `/grill-me` (video engine, local WASM, ROI processing, unified studio, Float32Array masks, dual-tier detection, bisection modes, pure TS inpainting).
- [x] Scaffolded Next.js (App Router, TypeScript, Tailwind CSS v4, `src/` directory).
- [x] Initialized shadcn/ui with dark theme tokens and primitives (`button`, `slider`, `badge`, `progress`, `tabs`, `card`, `tooltip`, `dialog`).
- [x] Configured `next.config.ts` with COOP (`same-origin`) and COEP (`require-corp`) cross-origin isolation headers for multithreaded WASM.
- [x] **Phase 2: Core Image Watermark Engine & Mask Porting**:
  - `scripts/generate-masks.mjs`: Extracted calibrated alpha masks from C++ sources into `masks.generated.ts`.
  - `src/lib/watermark/masks.ts`: Pre-decoded `FloatMat` loader with dynamic interpolation for custom/half-scale resolutions.
  - `src/lib/watermark/config.ts`: Aspect-ratio-aware placement and size calculations (`getWatermarkConfig`, `v2SmallConfigFromDims`).
  - `src/lib/watermark/image-ops.ts`: Pure TypeScript OpenCV-equivalent primitives (`sobelMagnitude`, `matchTemplateBest`, `gaussianBlurMat`, `dilateEllipse5`, `resizeAuto`, `meanStdDev`).
  - `src/lib/watermark/blender.ts`: In-place reverse alpha blending on `Uint8ClampedArray` (`(P_w - alpha * 255) / (1 - alpha)`).
  - `src/lib/watermark/detector.ts`: 3-stage NCC detector (spatial, gradient, variance dampening) + spatial rescue + auto V2-to-V1 fallback + multi-scale guided snap.
  - `src/lib/watermark/inpaint.ts`: Gradient-weighted soft Gaussian edge smoothing for recompressed JPEG artifacts.
  - `src/lib/watermark/engine.ts` & `index.ts`: High-level orchestrator (`processImage`, `processImageData`).
  - `scripts/test-engine.mjs`: E2E verification test passed with 98.8% detection confidence, reconstruction MAE of 0.1160 LSBs, and 6ms runtime.
- [x] **Phase 3: Client-Side Video Processing Pipeline**:
  - Integrated dynamic resolution-scaled Veo watermark detection from `bhushan/gemini-watermark-remover` (`size = round(min(w,h) / 15)`, `margin = round(min(w,h) / 10)`).
  - Adopted `mediabunny` hardware-accelerated WebCodecs for rapid H.264 video frame decoding and encoding with lossless audio packet passthrough.
  - Implemented real-time interactive `VideoTuner` (`src/components/workspace/VideoTuner.tsx`) featuring dual canvas previews (full frame overview and 200×200 pixelated zoomed corner) with real-time sliders for Gain (strength), Size Scale, Offset X, and Offset Y, plus Veo and Corner position presets.
  - Provided instant live feedback so users verify that the watermark disappears in the corner preview before launching the full video export.
- [x] **Top Header Matched to Reference (`coda.com` design)**:
  - Built floating charcoal (`#1e1e1e`) pill announcement bar with monospace uppercase text (`CODA HAS COMPLETED ITS ACQUISITION OF RECHARGE...`), `READ MORE →` action link, and right-aligned close `✕` button.
  - Implemented monumental ultra-chunky `CODA` wordmark on the left (`font-weight: 900`, tracking `[-0.05em]`).
  - Right-aligned navigation group with wide whitespace balance: `Products` (with interactive studio switcher dropdown), `Solutions`, `Knowledge Center`, and `Company`.
  - Verified visual 1:1 match against the user's reference image via live Chrome DevTools screenshots. Build validated clean.
- [x] **Agentation Visual Feedback & MCP Integration**:
  - Installed `agentation` package (`npm install agentation -D`).
  - Created client wrapper `src/components/AgentationWrapper.tsx` pointing to local Agentation MCP server on port `4747`.
  - Mounted `<AgentationWrapper />` into `src/app/layout.tsx`.
  - Confirmed active session registration with the Agentation MCP server via `agentation_list_sessions` and live floating UI toolbar in the browser.
  - Validated production build with zero SSR or hydration warnings.
- [x] **Agentation Feedback Round 1 Addressed**:
  - Removed "Solutions" and "Company" navigation links from Header.
  - Reimagined the Markless logo with an architectural sub-badge (`V2.0`) and subtitle (`Reverse Alpha Engine`).
  - Replaced "Contact us" with direct "Submit Issue" link pointing to `https://github.com/adityakhadsecode/markless/issues/new`.
  - Removed the inline flex status badge above the headline in `page.tsx`.
  - Added a tactile, prominent segmented studio mode switcher (`[ Image Studio (Gemini) ] [ Video Studio (Veo) ]`) centered directly above the workspace dropzone.
  - Replaced generic sparkles box in hero headline with a bespoke architectural `AbstractPolygonGlyph` SVG matching `DESIGN.md` (faceted rhombohedral prism with Mint Sprout, Sky Wash, Lilac Wash, and Rose Wash facet fills, 2.2px Obsidian outlines, and central alpha inversion star aperture).
  - `src/components/workspace/MediaDropzone.tsx`: Drag & drop, clipboard paste (`Ctrl+V`), and multi-file picker for both images and videos.
  - `src/components/workspace/ComparisonSlider.tsx`: Split-wipe comparison slider with zoom/pan, hold-to-peek (`V`/`Space`), and focus-watermark.
  - `src/components/workspace/TuningDrawer.tsx`: Sensitivity slider, profile selector, force removal toggle, and inpainting controls.
  - `src/components/workspace/TelemetryBadge.tsx`: Displays resolution, matched profile, confidence meter, and execution time.
  - `src/components/workspace/BatchDrawer.tsx`: High-throughput image batch queue with auto-detected CPU concurrency (clamped 2–6 workers), "Auto-download ZIP" toggle, completion toast with direct download action, thumbnail strip, and "Add More Images".
  - `src/components/workspace/ImageStudio.tsx`: Complete image restoration workspace with dynamic parallel worker pool based on `navigator.hardwareConcurrency`.
  - `src/components/workspace/VideoBatchDrawer.tsx`: Video batch queue with thumbnail previews, per-video progress meters, individual MP4 downloads, "Auto-download ZIP" toggle, and `JSZip` bundle export.
  - Robust batch error recovery: failing individual items are marked with an error badge and message while the batch queue gracefully completes all remaining files.
  - `src/components/workspace/VideoStudio.tsx`: Full video workspace with multi-video batch queue, live interactive corner tuner on active video, and sequential WebCodecs execution.
  - `src/app/page.tsx`: Assembled responsive workspace shell with studio switcher and technical footer.
  - Verified `npm run build` succeeds cleanly with 0 errors.
- [x] **Phase 5: Coda Architectural Marketplace Redesign (`DESIGN.md`)**:
  - Implemented warm Cream Parchment (`#f8f9eb`) canvas with tactile hairline borders (1.5px Obsidian `#000000` and Sage Mist `#c0c2a9`) — completely eliminating generic dark mode and drop shadows.
  - Standardized typography with `Space_Grotesk` (weights 400, 500, 700, 800) for monumental compressed display headlines and UI text, and `JetBrains_Mono` for system pill tags and telemetry badges.
  - Implemented Coda Announcement Bar, pill status badges (`rounded-full`, 1.5px border), Charcoal (`#202020`) primary action buttons (`rounded-[13px]`), and secondary ghost buttons (`rounded-[9px]`).
  - Added signature Full-Bleed Forest Depths (`#003d21`) feature section with 45px mound top radius and organic Mint Sprout decorations.
  - Added Pastel Surface Cards (`#aafdc0`, `#d3beff`, `#b0f4ff`, `#ffc0e6`) for modular feature highlights.
  - Refactored `MediaDropzone`, `ComparisonSlider`, `TuningDrawer`, `TelemetryBadge`, `BatchDrawer`, `VideoTuner`, `VideoBatchDrawer`, and `VideoStudio` to strict Coda design invariants.
  - Verified production build `npm run build` compiles with 0 errors in 1.6s.
- [x] **Architectural Editorial Footer (`src/components/workspace/Footer.tsx`)**:
  - Implemented Coda-styled architectural footer with 1.5px hairline grid borders and warm `#f8f9eb` palette.
  - Pre-footer banner: "Restore Media Locally. Zero Cloud Uploads. Zero Artifacts." with direct actions ("Start Restoring", "Buy Me a Coffee").
  - 4-column layout: Markless brand column, Studios column (interactive switching to Image Studio / Video Studio with smooth scroll), Architecture column (links to mathematical docs), and Project column (GitHub repo, issue tracker, Buy Me a Coffee).
  - Telemetry badges strip: 100% In-Browser Execution, WebCodecs Hardware Accelerated, Lossless Audio Passthrough.
  - Bottom bar: "Crafted with ❤️ by Aditya Khadse" and smooth "BACK TO TOP ↑" scroll trigger.
  - Resolved Agentation visual feedback: removed status pill under footer brand column, finalized clean hero typography "REMOVE WATERMARKS. NO BLUR NO ARTIFACTS".
  - Production build tested and verified error-free.
- [x] **Project Rebrand to Markless**:
  - Renamed GitHub repository to `adityakhadsecode/markless` via `gh repo rename`.
  - Updated Git remote origin to `https://github.com/adityakhadsecode/markless.git`.
  - Rebranded UI wordmark, hero badge, metadata title, and package configuration to **Markless**.
- [x] **GitHub Pages Static Deployment Setup**:
  - Configured Next.js static export (`output: 'export'`) with production `basePath: '/markless'` and unoptimized images.
  - Implemented `getAssetPath` helper for static assets (`/assets/bg_96.png`, `/ffmpeg/...`, logo navigation).
  - Created `.github/workflows/deploy.yml` for automated GitHub Actions build and deploy to GitHub Pages.
  - Enabled GitHub Pages on `adityakhadsecode/markless` via GitHub API.
  - Public live URL: `https://adityakhadsecode.github.io/markless/`.

---

## Architecture Decisions

1. **Pure Client-Side Math**: Watermark removal runs 100% on the client device (using typed arrays and in-browser WASM) to provide instant response times, zero server costs, and guaranteed privacy.
2. **Deterministic Inversion over Generative AI**: Following Allen Kuo's canonical methodology, reverse alpha blending is used instead of hallucinating inpainting models.
3. **Audio Preservation Invariant**: Video audio tracks are passed through directly into the output MP4 container without re-encoding (`-c:a copy`).
4. **Client-Side Video Engine**: Selected **FFmpeg.wasm** for maximum codec reliability and container support, using cross-origin isolation headers for multithreaded WASM performance.
5. **Local Offline WASM Assets**: FFmpeg core and WASM files are vendored directly in `/public/ffmpeg/` to ensure true offline functionality and avoid third-party CDN latency or CORS issues.
6. **ROI-Only Frame Processing**: Only the small watermark bounding box (~48×48 px) is manipulated and patched per frame, preventing multi-megabyte canvas roundtrips and accelerating frame throughput by ~100x.
7. **Unified Studio Navigation**: Single cohesive Next.js client shell with top-level segmented switching between `Image Studio` and `Video Studio`, sharing dark industrial design tokens and common telemetry badges.
8. **Pre-Computed Float32Array Masks**: Alpha maps are bundled directly as normalized `Float32Array` constants, eliminating runtime image decoding latency and enabling instant startup with zero DOM dependencies.
9. **Dual-Tier Detection UX**: Fully automatic V2-with-V1 fallback by default, backed by a collapsible manual tuning drawer allowing threshold adjustment, profile pinning, and 8-point bounding box snap.
10. **Dual-Mode Video Temporal Filtering**: Adaptive bisection feedback loop (5 iterations with ±0.05 per-frame change cap) for difficult clips, with a "Fast Lock" toggle that anchors the per-shot median alpha for 3x faster processing on clean clips.
11. **Lightweight Gradient-Weighted Soft Inpaint**: Implemented in pure TypeScript (zero OpenCV.js WASM bloat), applying soft Gaussian diffusion strictly along residual alpha gradient edges for recompressed images.
