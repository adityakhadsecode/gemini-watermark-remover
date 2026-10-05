# Gemini & Veo Watermark Remover

> **100% Client-Side In-Browser Media Restoration Tool**  
> Mathematically precise reverse alpha blending to remove visible watermarks from Google Gemini AI images and Google Veo videos with zero cloud uploads, zero generative hallucinations, and lossless audio passthrough.

---

## ✨ Features

### 🖼️ Image Studio
- **Mathematical Inversion**: Restores original pixel values via canonical reverse alpha blending:  
  $$\text{Original} = \text{clamp}\left(\frac{\text{Watermarked} - \alpha \times 255}{1 - \alpha}, 0, 255\right)$$
- **Calibrated Multi-Profile Support**: Built-in calibrated alpha masks for **Gemini 3.5+ (V2)**, **Legacy Gemini (V1)**, and free-tier half-scale (1376×768) resolutions.
- **3-Stage NCC Detector**: Spatial and gradient-space Normalized Cross-Correlation with variance dampening and automatic V2-to-V1 fallback.
- **Interactive Split Slider**: Real-time before/after comparison slider with zoom/pan, 1-click watermark focus, and hold-to-peek original (`Space` / `V`).
- **Batch Processing**: Queue dozens of images with progress indicators and one-click **Export All (.ZIP)**.
- **Soft Edge Inpainting**: Optional gradient-weighted Gaussian edge smoothing to eliminate faint JPEG recompression halos.

### 🎥 Video Studio (Veo)
- **Dynamic Resolution-Scaled Geometry**: Automatically calculates watermark position and size based on video dimensions (`base = min(width, height)`, `size = round(base / 15)`, `margin = round(base / 10)`).
- **Live Interactive Tuner**: Real-time corner preview with 200×200 magnified pixel view and live sliders for:
  - **Inversion Strength (Gain)**
  - **Watermark Size**
  - **Offset X & Y**
  - **Veo (Default Inset) & Classic Corner Presets**
- **Hardware-Accelerated WebCodecs**: Powered by `mediabunny` for fast H.264 frame decoding and encoding directly on your GPU/CPU.
- **Lossless Audio Passthrough**: Audio streams pass directly through without lossy re-encoding (`-c:a copy` equivalent).

### 🔒 100% Client-Side Privacy
- Zero server endpoints. All pixel manipulation, decoding, and encoding run entirely within your local browser sandbox.
- Your media never leaves your device.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- A modern desktop browser with WebCodecs support (Chrome, Edge, Brave, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/adityakhadsecode/gemini-watermark-remover.git
cd gemini-watermark-remover

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Vanilla CSS tokens
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Dark Industrial Technical Theme)
- **Video Engine**: WebCodecs + [mediabunny](https://github.com/Vanilagy/mediabunny)
- **Image Math**: Typed `Float32Array` kernels & pure TypeScript CV primitives
- **Exporting**: [JSZip](https://stuk.github.io/jszip/)

---

## 📚 Acknowledgments & References

- [allenk/GeminiWatermarkTool](https://github.com/allenk/GeminiWatermarkTool): Canonical reverse alpha blending methodology, 3-stage NCC detection, and calibrated alpha masks.
- [allenk/VeoWatermarkRemover](https://github.com/allenk/VeoWatermarkRemover): Video watermark removal and temporal bisection concepts.
- [dearabhin/gemini-watermark-remover](https://github.com/dearabhin/gemini-watermark-remover): Veo dynamic watermark geometry formulas and live tuner inspiration.

---

## 📄 License

MIT License. Free for personal and educational use.
