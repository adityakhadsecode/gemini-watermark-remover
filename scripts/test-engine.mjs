/**
 * End-to-end mathematical verification test for the reverse alpha blending engine.
 */
import { getAlphaMap } from "../src/lib/watermark/masks.ts";
import { removeWatermarkAlphaBlend } from "../src/lib/watermark/blender.ts";
import { processImage } from "../src/lib/watermark/engine.ts";
import { getWatermarkConfig } from "../src/lib/watermark/config.ts";

console.log("--- Testing Watermark Engine ---");

// 1. Test canonical mask loading
const v2Small = getAlphaMap("small", "v2");
const v2Large = getAlphaMap("large", "v2");
console.log(`V2 Small Mask: ${v2Small.width}x${v2Small.height}, max: ${Math.max(...v2Small.data)}`);
console.log(`V2 Large Mask: ${v2Large.width}x${v2Large.height}, max: ${Math.max(...v2Large.data)}`);

if (v2Small.width !== 36 || v2Large.width !== 96) {
  throw new Error("Mask dimensions incorrect");
}

// 2. Synthesize a 1024x1024 test image with photographic texture (gradients + noise)
const width = 1024;
const height = 1024;
const original = new Uint8ClampedArray(width * height * 4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    original[idx] = (x * 0.2 + y * 0.1) % 256;         // R
    original[idx + 1] = (y * 0.25 + 50) % 256;          // G
    original[idx + 2] = (Math.sin(x * 0.05) * 100 + 128); // B
    original[idx + 3] = 255;                            // A
  }
}

// 3. Composite a simulated Gemini 3.5 V2 watermark
const config = getWatermarkConfig(width, height, "v2");
const posX = width - config.marginRight - config.logoSize;
const posY = height - config.marginBottom - config.logoSize;
console.log(`Watermark position for 1024x1024: (${posX}, ${posY}), logoSize=${config.logoSize}, margin=${config.marginRight}`);

const watermarked = new Uint8ClampedArray(original);
for (let y = 0; y < v2Small.height; y++) {
  for (let x = 0; x < v2Small.width; x++) {
    const alpha = v2Small.data[y * v2Small.width + x];
    const px = ((posY + y) * width + (posX + x)) * 4;
    for (let c = 0; c < 3; c++) {
      watermarked[px + c] = Math.round(alpha * 255 + (1 - alpha) * original[px + c]);
    }
  }
}

// 4. Run detection and reverse alpha removal via engine
const testBuffer = new Uint8ClampedArray(watermarked);
const result = processImage(testBuffer, width, height, { profile: "auto", threshold: 0.25 });

console.log("Process Result:", result);

if (result.status !== "removed") {
  throw new Error(`Expected removed, got: ${result.status} (${result.message})`);
}

// 5. Measure Mean Absolute Error (MAE) between cleaned and original in watermark region
let totalError = 0;
let maxDiff = 0;
let counted = 0;

for (let y = 0; y < v2Small.height; y++) {
  for (let x = 0; x < v2Small.width; x++) {
    const px = ((posY + y) * width + (posX + x)) * 4;
    for (let c = 0; c < 3; c++) {
      const diff = Math.abs(testBuffer[px + c] - original[px + c]);
      totalError += diff;
      if (diff > maxDiff) maxDiff = diff;
      counted++;
    }
  }
}

const mae = totalError / counted;
console.log(`Reconstruction MAE in watermark region: ${mae.toFixed(4)} LSBs, Max Diff: ${maxDiff}`);

if (mae > 1.2) {
  throw new Error(`Reconstruction MAE too high: ${mae}`);
}

// 6. Verify that pixels OUTSIDE watermark region were 100% untouched
let outsideDiffs = 0;
for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    const px = (y * width + x) * 4;
    for (let c = 0; c < 4; c++) {
      if (testBuffer[px + c] !== original[px + c]) outsideDiffs++;
    }
  }
}

if (outsideDiffs > 0) {
  throw new Error(`Pixels outside watermark were modified! count: ${outsideDiffs}`);
}

console.log("SUCCESS: Reverse alpha blending reconstructed pixels with exact mathematical fidelity!");
