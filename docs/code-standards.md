# Code Standards & Conventions

## General Principles

- **Separation of Concerns**: Algorithmic math kernels (`src/lib/watermark/`), video processing pipes (`src/lib/video/`), and React presentation components (`src/components/`) must remain strictly isolated. No React state or JSX inside the core mathematical modules.
- **Root-Cause Accuracy**: Reverse alpha blending is mathematically exact. Calibrated masks and bisection parameters must align with reverse alpha blending specifications.
- **Memory Hygiene**: Video frames and large image buffers occupy substantial RAM. Always revoke Object URLs (`URL.revokeObjectURL`) when discarded, explicitly close `VideoFrame` instances in WebCodecs, and terminate idle Web Workers.

---

## TypeScript & Types

- **Strict Mode**: `strict: true`, `noImplicitAny: true` enabled throughout.
- **Typed Pixel Buffers**: Image processing functions must accept and return explicit typed buffers (e.g. `ImageData`, `Uint8ClampedArray`, or `Float32Array` for alpha maps).
- **Comprehensive Domain Types**:
  ```typescript
  export type WatermarkVariant = 'v1_small' | 'v1_large' | 'v2_small' | 'v2_large' | 'veo_1080p' | 'veo_720p_std' | 'veo_720p_compact' | 'veo_text';
  
  export interface WatermarkRegion {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface DetectionResult {
    detected: boolean;
    confidence: number; // 0.0 to 1.0
    variant: WatermarkVariant;
    region: WatermarkRegion;
    alphaMap: Float32Array;
  }
  ```

---

## Mathematical Safety & Precision

- **Alpha Inversion Formula**:
  $$\text{Original} = \frac{\text{Watermarked} - (\alpha \times 255)}{1 - \alpha}$$
- **Division by Zero Protection**:
  When $\alpha \ge 0.999$, clamp $\alpha$ to $0.99$ or blend with soft neighborhood interpolation to prevent `NaN` / infinity artifacts.
- **Value Clamping**:
  Always clamp output RGB color channels:
  $$\text{channel} = \max(0, \min(255, \text{Math.round}(\text{rawVal})))$$

---

## Next.js & Client Boundaries

- **Client Component Rules**: Mark interactive pages and workspace views with `'use client'`. Next.js serves as the application shell, routing engine, and static deployer.
- **Dynamic Imports**: Any WebCodecs, Canvas, or Web Worker initialization must run dynamically on the client side without triggering SSR hydration mismatches:
  ```typescript
  if (typeof window !== 'undefined') { ... }
  ```
- **Zero API Routes for Media**: No `/api/process-image` or `/api/process-video` routes. Everything runs directly in the client browser.

---

## Styling & Component Conventions

- **Tailwind & shadcn/ui**: Use class names composed with `cn()` utility (`clsx` + `tailwind-merge`).
- **Tokens over Raw Values**: Use semantic CSS tokens (`bg-background`, `border-border`, `text-muted-foreground`) rather than arbitrary hardcoded hex strings.
- **Accessible Interactions**: Every interactive control must have an `aria-label`, visible keyboard focus states, and appropriate ARIA attributes.

---

## File Organization

```
src/
├── app/
│   ├── layout.tsx                # App shell, fonts, dark theme provider
│   ├── page.tsx                  # Main studio interface
│   └── globals.css               # Design system tokens and base styles
├── components/
│   ├── ui/                       # shadcn/ui primitives (button, slider, tabs, etc.)
│   └── workspace/                # Studio features (dropzone, comparison, scrubber, queue)
├── lib/
│   ├── watermark/                # Core reverse alpha blending math & masks
│   │   ├── masks.ts              # Pre-calibrated alpha matrices
│   │   ├── detector.ts           # NCC template detection & confidence scoring
│   │   ├── blender.ts            # Mathematical inversion & clamping
│   │   └── inpaint.ts            # Soft edge residual smoothing
│   ├── video/                    # Video decoding, processing, and remuxing
│   │   ├── demuxer.ts            # MP4/WebM demuxer (audio passthrough)
│   │   ├── frame-pipeline.ts     # WebCodecs / Canvas frame processor
│   │   ├── temporal-filter.ts    # Adaptive bisection & anti-flicker cap
│   │   └── muxer.ts              # MP4 remuxer
│   └── workers/                  # Web Worker wrappers for off-thread processing
└── hooks/                        # Custom React hooks (useWatermarkRemover, useVideoProcessor)
```
