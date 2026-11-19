// effects.js — finishes that sit on top of the composed art: film grain,
// scanlines, halftone dots, vignette and a poster frame.

import { rng } from "./state.js";

const grainCache = new Map();

function grainTile(size, seed) {
  const key = `${size}:${seed}`;
  if (grainCache.has(key)) return grainCache.get(key);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  const img = g.createImageData(size, size);
  const noise = rng(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (noise() * 255) | 0;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainCache.set(key, c);
  return c;
}

export function paintGrain(ctx, W, H) {
  const tile = grainTile(256, 9127);
  const pattern = ctx.createPattern(tile, "repeat");
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function paintScanlines(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = "#000";
  const gap = Math.max(2, Math.round(Math.min(W, H) / 340));
  for (let y = 0; y < H; y += gap * 2) ctx.fillRect(0, y, W, gap);
  ctx.restore();
}

export function paintHalftone(ctx, W, H) {
  const step = Math.max(6, Math.round(Math.min(W, H) / 130));
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "#000";
  for (let y = step / 2, row = 0; y < H; y += step, row++) {
    for (let x = (row % 2) * step / 2; x < W; x += step) {
      // Dots grow toward the bottom of the frame, like a fading print.
      const t = y / H;
      const r = (step * 0.24) * (0.25 + 0.75 * t);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function paintVignette(ctx, W, H, deep) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.74);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, deep);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Dark outer frame plus a thin warm keyline just inside it.
export function paintFrame(ctx, W, H, accent) {
  const band = Math.round(Math.min(W, H) * 0.022);
  const key = Math.max(2, Math.round(Math.min(W, H) * 0.0035));
  ctx.save();
  ctx.fillStyle = "#0b0a0c";
  ctx.fillRect(0, 0, W, band);
  ctx.fillRect(0, H - band, W, band);
  ctx.fillRect(0, 0, band, H);
  ctx.fillRect(W - band, 0, band, H);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = accent;
  ctx.fillRect(band, band, W - band * 2, key);
  ctx.fillRect(band, H - band - key, W - band * 2, key);
  ctx.fillRect(band, band, key, H - band * 2);
  ctx.fillRect(W - band - key, band, key, H - band * 2);
  ctx.restore();
}
