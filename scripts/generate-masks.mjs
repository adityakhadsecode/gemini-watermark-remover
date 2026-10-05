/**
 * Generates src/lib/watermark/masks.generated.ts from calibrated
 * background captures.
 *
 * Usage:
 *   node scripts/generate-masks.mjs <path-to-assets-dir>
 *
 * Formula: alpha = max(R, G, B) / 255.
 * We store the 8-bit max-channel values (exact source precision) as base64
 * and expand them to Float32Array at module load — no DOM / canvas needed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const repo = process.argv[2];
if (!repo) {
  console.error("Usage: node scripts/generate-masks.mjs <assets-dir>");
  process.exit(1);
}

const header = readFileSync(join(repo, "assets", "embedded_assets.hpp"), "utf8");

function extractArray(name) {
  const re = new RegExp(`${name}\\[\\]\\s*=\\s*\\{([^}]*)\\}`);
  const m = header.match(re);
  if (!m) throw new Error(`Array ${name} not found`);
  const bytes = m[1].match(/0x[0-9a-fA-F]{2}/g).map((h) => parseInt(h, 16));
  return Buffer.from(bytes);
}

/** Minimal PNG decoder: 8-bit, non-interlaced, color types 0/2/6. */
function decodePng(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  sig.forEach((b, i) => {
    if (buf[i] !== b) throw new Error("Not a PNG");
  });
  let off = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) throw new Error("Unsupported PNG format");
  const channels = { 0: 1, 2: 3, 6: 4 }[colorType];
  if (!channels) throw new Error(`Unsupported color type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      switch (filter) {
        case 0: break;
        case 1: v += a; break;
        case 2: v += b; break;
        case 3: v += (a + b) >> 1; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default: throw new Error(`Bad filter ${filter}`);
      }
      cur[x] = v & 0xff;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { width, height, channels, pixels: out };
}

/** max(R,G,B) per pixel, matching calculate_alpha_map(). */
function maxChannel({ width, height, channels, pixels }) {
  const out = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (channels === 1) {
      out[i] = pixels[i];
    } else {
      const p = i * channels;
      out[i] = Math.max(pixels[p], pixels[p + 1], pixels[p + 2]);
    }
  }
  return out;
}

const assets = [
  { key: "V1_SMALL", src: "bg_48_png", size: 48, label: "Legacy (pre-Gemini 3.5) small, 48x48" },
  { key: "V1_LARGE", src: "bg_96_png", size: 96, label: "Legacy (pre-Gemini 3.5) large, 96x96" },
  { key: "V2_SMALL", src: "bg_b_36_png", size: 36, label: "Gemini 3.5+ small, 36x36" },
  { key: "V2_LARGE", src: "bg_b_96_png", size: 96, label: "Gemini 3.5+ large, 96x96" },
];

let body = "";
for (const a of assets) {
  const png = decodePng(extractArray(a.src));
  if (png.width !== a.size || png.height !== a.size) {
    // The C++ engine resizes with INTER_AREA when sizes differ; the shipped
    // assets are already canonical, so treat a mismatch as a hard error.
    throw new Error(`${a.src}: expected ${a.size}x${a.size}, got ${png.width}x${png.height}`);
  }
  const values = maxChannel(png);
  body += `/** ${a.label} */\n`;
  body += `const ${a.key}_B64 =\n  "${Buffer.from(values).toString("base64")}";\n\n`;
  console.log(`${a.key}: ${a.size}x${a.size}, max alpha ${Math.max(...values) / 255}`);
}

const file = `/* eslint-disable */
// Calibrated alpha maps for Gemini watermark variants (V1 & V2).
// Formatted as compact Base64 Float32Array buffers.

${body}export const MASK_SOURCES = {
  V1_SMALL: { size: 48, b64: V1_SMALL_B64 },
  V1_LARGE: { size: 96, b64: V1_LARGE_B64 },
  V2_SMALL: { size: 36, b64: V2_SMALL_B64 },
  V2_LARGE: { size: 96, b64: V2_LARGE_B64 },
} as const;
`;

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "..", "src", "lib", "watermark", "masks.generated.ts");
writeFileSync(outPath, file);
console.log(`Wrote ${outPath}`);
