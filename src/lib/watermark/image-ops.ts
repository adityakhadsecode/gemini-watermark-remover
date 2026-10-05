/**
 * Minimal, dependency-free re-implementations of the OpenCV primitives used
 * by GeminiWatermarkTool. Semantics follow OpenCV defaults:
 *  - BORDER_REFLECT_101 for Sobel / GaussianBlur
 *  - Half-pixel-centre mapping for INTER_LINEAR resize
 *  - Exact pixel-area weighting for INTER_AREA downscale
 *  - TM_CCOEFF_NORMED for template matching
 */
import type { FloatMat, Rect } from "./types";

export function createMat(width: number, height: number): FloatMat {
  return { width, height, data: new Float32Array(width * height) };
}

/** BORDER_REFLECT_101: ... 2 1 | 0 1 2 ... n-1 | n-2 n-3 ... */
function reflect101(i: number, n: number): number {
  if (n === 1) return 0;
  while (i < 0 || i >= n) {
    if (i < 0) i = -i;
    if (i >= n) i = 2 * n - 2 - i;
  }
  return i;
}

/**
 * RGBA (ImageData layout) sub-region -> grayscale float [0,1].
 * Uses the BT.601 weights of cv::COLOR_BGR2GRAY, rounded to 8-bit first
 * exactly like OpenCV does before convertTo(CV_32F, 1/255).
 */
export function grayRegion(
  rgba: Uint8ClampedArray,
  imageWidth: number,
  rect: Rect,
): { mat: FloatMat; gray8: Uint8Array } {
  const mat = createMat(rect.width, rect.height);
  const gray8 = new Uint8Array(rect.width * rect.height);
  for (let y = 0; y < rect.height; y++) {
    for (let x = 0; x < rect.width; x++) {
      const p = ((rect.y + y) * imageWidth + (rect.x + x)) * 4;
      const g = Math.round(0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]);
      const i = y * rect.width + x;
      gray8[i] = g;
      mat.data[i] = g / 255;
    }
  }
  return { mat, gray8 };
}

export function subMat(src: FloatMat, rect: Rect): FloatMat {
  const out = createMat(rect.width, rect.height);
  for (let y = 0; y < rect.height; y++) {
    const s = (rect.y + y) * src.width + rect.x;
    out.data.set(src.data.subarray(s, s + rect.width), y * rect.width);
  }
  return out;
}

/** cv::resize with INTER_LINEAR (half-pixel centres, edge clamp). */
export function resizeLinear(src: FloatMat, dw: number, dh: number): FloatMat {
  const out = createMat(dw, dh);
  const sx = src.width / dw;
  const sy = src.height / dh;
  for (let y = 0; y < dh; y++) {
    let fy = (y + 0.5) * sy - 0.5;
    let y0 = Math.floor(fy);
    fy -= y0;
    if (y0 < 0) { y0 = 0; fy = 0; }
    const y1 = Math.min(y0 + 1, src.height - 1);
    if (y0 >= src.height - 1) { y0 = src.height - 1; fy = 0; }
    for (let x = 0; x < dw; x++) {
      let fx = (x + 0.5) * sx - 0.5;
      let x0 = Math.floor(fx);
      fx -= x0;
      if (x0 < 0) { x0 = 0; fx = 0; }
      const x1 = Math.min(x0 + 1, src.width - 1);
      if (x0 >= src.width - 1) { x0 = src.width - 1; fx = 0; }
      const a = src.data[y0 * src.width + x0];
      const b = src.data[y0 * src.width + x1];
      const c = src.data[y1 * src.width + x0];
      const d = src.data[y1 * src.width + x1];
      out.data[y * dw + x] =
        a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
    }
  }
  return out;
}

/** cv::resize with INTER_AREA for downscaling (exact area coverage). */
export function resizeArea(src: FloatMat, dw: number, dh: number): FloatMat {
  if (dw > src.width || dh > src.height) return resizeLinear(src, dw, dh);
  const out = createMat(dw, dh);
  const sx = src.width / dw;
  const sy = src.height / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = y * sy;
    const y1 = y0 + sy;
    for (let x = 0; x < dw; x++) {
      const x0 = x * sx;
      const x1 = x0 + sx;
      let sum = 0;
      let area = 0;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) {
        const wy = Math.min(y1, yy + 1) - Math.max(y0, yy);
        if (wy <= 0) continue;
        for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
          const wx = Math.min(x1, xx + 1) - Math.max(x0, xx);
          if (wx <= 0) continue;
          const w = wx * wy;
          sum += src.data[yy * src.width + xx] * w;
          area += w;
        }
      }
      out.data[y * dw + x] = sum / area;
    }
  }
  return out;
}

/** Resize choosing INTER_LINEAR for upscale, INTER_AREA for downscale. */
export function resizeAuto(src: FloatMat, dw: number, dh: number): FloatMat {
  if (dw === src.width && dh === src.height) {
    return { width: dw, height: dh, data: src.data.slice() };
  }
  return dw > src.width || dh > src.height
    ? resizeLinear(src, dw, dh)
    : resizeArea(src, dw, dh);
}

/** 3x3 Sobel gradient magnitude, BORDER_REFLECT_101. */
export function sobelMagnitude(src: FloatMat): FloatMat {
  const { width: w, height: h, data } = src;
  const out = createMat(w, h);
  const at = (x: number, y: number) => data[reflect101(y, h) * w + reflect101(x, w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx =
        -at(x - 1, y - 1) + at(x + 1, y - 1) +
        -2 * at(x - 1, y) + 2 * at(x + 1, y) +
        -at(x - 1, y + 1) + at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
      out.data[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return out;
}

/**
 * cv::matchTemplate(..., TM_CCOEFF_NORMED) followed by cv::minMaxLoc.
 * Returns the best score and its top-left offset within `image`.
 */
export function matchTemplateBest(
  image: FloatMat,
  tmpl: FloatMat,
): { score: number; x: number; y: number } {
  const tw = tmpl.width;
  const th = tmpl.height;
  const n = tw * th;
  let tMean = 0;
  for (let i = 0; i < n; i++) tMean += tmpl.data[i];
  tMean /= n;
  const tz = new Float32Array(n);
  let tVar = 0;
  for (let i = 0; i < n; i++) {
    tz[i] = tmpl.data[i] - tMean;
    tVar += tz[i] * tz[i];
  }

  let best = { score: -Infinity, x: 0, y: 0 };
  for (let oy = 0; oy <= image.height - th; oy++) {
    for (let ox = 0; ox <= image.width - tw; ox++) {
      let sumI = 0;
      let sumI2 = 0;
      let cross = 0;
      for (let y = 0; y < th; y++) {
        const row = (oy + y) * image.width + ox;
        const trow = y * tw;
        for (let x = 0; x < tw; x++) {
          const v = image.data[row + x];
          sumI += v;
          sumI2 += v * v;
          cross += v * tz[trow + x];
        }
      }
      const iVar = sumI2 - (sumI * sumI) / n;
      const denom = Math.sqrt(Math.max(iVar, 0) * tVar);
      // OpenCV yields 0 when either window is flat (no structure to match).
      const score = denom > 1e-12 ? cross / denom : 0;
      if (score > best.score) best = { score, x: ox, y: oy };
    }
  }
  if (best.score === -Infinity) best.score = 0;
  return best;
}

/** Population mean / std-dev (cv::meanStdDev) of 8-bit values. */
export function meanStdDev(values: Uint8Array): { mean: number; std: number } {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  const mean = sum / values.length;
  let sq = 0;
  for (let i = 0; i < values.length; i++) sq += (values[i] - mean) ** 2;
  return { mean, std: Math.sqrt(sq / values.length) };
}

/** cv::getGaussianKernel for sigma > 0. */
export function gaussianKernel(ksize: number, sigma: number): Float32Array {
  const k = new Float32Array(ksize);
  const c = (ksize - 1) / 2;
  let sum = 0;
  for (let i = 0; i < ksize; i++) {
    k[i] = Math.exp(-((i - c) ** 2) / (2 * sigma * sigma));
    sum += k[i];
  }
  for (let i = 0; i < ksize; i++) k[i] /= sum;
  return k;
}

/** Kernel size OpenCV picks for Size(0,0) on CV_32F input. */
export function autoKsizeFloat(sigma: number): number {
  return Math.round(sigma * 4 * 2 + 1) | 1;
}

/** Separable Gaussian blur on a float matrix, BORDER_REFLECT_101. */
export function gaussianBlurMat(src: FloatMat, sigma: number, ksize = autoKsizeFloat(sigma)): FloatMat {
  const k = gaussianKernel(ksize, sigma);
  const r = (ksize - 1) / 2;
  const { width: w, height: h } = src;
  const tmp = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += src.data[y * w + reflect101(x + i, w)] * k[i + r];
      tmp[y * w + x] = s;
    }
  }
  const out = createMat(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += tmp[reflect101(y + i, h) * w + x] * k[i + r];
      out.data[y * w + x] = s;
    }
  }
  return out;
}

/** OpenCV MORPH_ELLIPSE 5x5 structuring element. */
const ELLIPSE_5 = [
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
];

/** cv::dilate with a 5x5 ellipse; out-of-bounds pixels are ignored. */
export function dilateEllipse5(src: FloatMat): FloatMat {
  const { width: w, height: h } = src;
  const out = createMat(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = -Infinity;
      for (let ky = 0; ky < 5; ky++) {
        const yy = y + ky - 2;
        if (yy < 0 || yy >= h) continue;
        for (let kx = 0; kx < 5; kx++) {
          if (!ELLIPSE_5[ky][kx]) continue;
          const xx = x + kx - 2;
          if (xx < 0 || xx >= w) continue;
          const v = src.data[yy * w + xx];
          if (v > m) m = v;
        }
      }
      out.data[y * w + x] = m;
    }
  }
  return out;
}

export function intersectRect(a: Rect, b: Rect): Rect {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return { x: x1, y: y1, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1) };
}
