# UI Context & Design System

## Theme & Aesthetic

- **Design Philosophy**: High-end industrial technical workspace with subtle dark brutalist elegance.
- **Tone**: Focused, precision-engineered, uncompromising dark mode. The UI should feel like a specialized high-performance media lab (similar to Davinci Resolve or linear creative tools) rather than a generic SaaS landing page.
- **Lighting & Surfaces**:
  - Near-black backgrounds (`#09090b` / `#0c0d0e`) layered with subtle zinc/slate surfaces (`#121316`, `#18191d`).
  - Razor-thin 1px borders (`rgba(255, 255, 255, 0.08)`) with micro-highlights.
  - Crisp monochromatic base with high-visibility functional accents (electric indigo `#6366f1` / cyan `#06b6d4` for active telemetry and processing states).

---

## Design Tokens

### Colors (CSS Custom Properties)

| Role | CSS Variable | Hex / HSL | Usage |
| --- | --- | --- | --- |
| Canvas Background | `--background` | `#09090b` | Base viewport background |
| Surface Primary | `--card` | `#121316` | Main cards, inspectors, toolbars |
| Surface Secondary | `--popover` | `#18191e` | Dropdowns, tooltips, dialogs |
| Muted Surface | `--muted` | `#22242a` | Inactive tabs, slider tracks |
| Primary Text | `--foreground` | `#f4f4f5` | Headings, active values, badges |
| Secondary Text | `--muted-foreground` | `#9ca3af` | Labels, metadata, helper hints |
| Border Default | `--border` | `#27272a` (or `rgba(255,255,255,0.08)`) | Container borders, dividers |
| Accent Primary | `--primary` | `#6366f1` | Primary actions, detected watermark badges |
| Accent Glow | `--primary-glow` | `rgba(99, 102, 241, 0.15)` | Focus rings, active drop zones |
| Success / Detection | `--emerald` | `#10b981` | Cleaned status, confidence >90% |
| Warning / Low Conf | `--amber` | `#f59e0b` | Manual tuning needed, confidence <50% |
| Destructive | `--destructive` | `#ef4444` | Remove file, reset actions |

---

## Typography

- **Headings & Body**: `Inter` / `Geist Sans` (`--font-sans`). Crisp letter spacing, neutral geometric sans.
- **Data, Coordinates, FPS, & Timers**: `Geist Mono` / `JetBrains Mono` (`--font-mono`). Tabular numbers (`tabular-nums`) to avoid layout jitter during video scrubbing and batch processing.

```css
--font-sans: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace;
```

---

## Component System (shadcn/ui)

All UI elements use standard shadcn/ui primitives customized with our dark technical tokens:

- **Button**: Sharp micro-radii (`rounded-md`), subtle bevel/inset shadow, active scale `active:scale-[0.98]`.
- **Slider**: Precision drag handle with numeric tooltip for alpha threshold and inpaint radius.
- **Tabs**: Segmented pill control (`Image Mode` vs `Video Mode`) with animated background highlight.
- **Badge**: Monospace telemetry tags (e.g. `V2 · 96×96 · 98.4% CONF`, `1080p · 24 FPS`).
- **Dialog & Sheet**: Frosted dark glass overlay (`backdrop-blur-md bg-black/60`).
- **Progress**: Linear gradient indicator with smooth CSS transition.

---

## Specialized Workspace Components

### 1. Unified Studio Shell with Mode Switcher
- Centered top toolbar with a segmented pill toggle: `Image Studio` / `Video Studio`.
- Seamless state preservation when switching modes.
- Shared telemetry bar: displays detected profile (`Gemini 3.5 V2` vs `Veo 1080p`), dimensions, confidence score, and processing time.

### 2. Interactive Comparison Split-Slider (Image Studio)
- Double-buffered canvas or CSS clip-path overlay.
- Drag handle dividing "Original" (watermarked) and "Cleaned" (restored) views.
- Keyboard toggle shortcut (`V` or `Space` to hold/peek original).

### 3. Video Player & Frame Scrubber (Video Studio)
- Synchronized scrub bar showing timecode (`00:01:23.12`), frame index (`F# 142`), and watermark detection status per keyframe.
- Loop and play/pause controls with keyboard shortcuts (`K` play/pause, `J`/`L` frame step).

### 4. Media Dropzone
- Full-screen or zoned drop targets with drag-over glow and SVG dashed borders.
- Direct clipboard paste support (`Ctrl+V` / `Cmd+V`).

### 5. Batch Operations Drawer
- Compact horizontal strip or collapsible sidebar showing queued files, thumbnail previews, processing status badges, and "Export All (.ZIP)" CTA.

### 6. Tuning & Override Drawer (Collapsible)
- **Automatic Fallback State**: Shows detected profile (e.g. `Auto: Gemini 3.5 V2`) and confidence meter.
- **Sensitivity Slider**: Threshold range from 0.20 to 0.80 (default 0.35).
- **Manual Profile Pin**: Radios to lock `Auto`, `Gemini 3.5+ (V2)`, `Legacy (V1)`, or `Veo Custom`.
- **Interactive Region Snap**: Interactive draggable 8-point bounding box on canvas with coarse-to-fine NCC snap assistance.
- **Inpainting Smoothing**: Optional soft edge radius slider (1–15 px) and strength slider for recompressed media.
