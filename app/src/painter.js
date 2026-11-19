// painter.js — renders the whole poster into a canvas: deep background,
// panel photos (cover-cropped), a synth-style placeholder for empty panels,
// grade overlays, divider gutters, caption and finishes.

import { slotsFor, pixelRect, gutterFor } from "./layouts.js";
import { GRADES, paintOverlays } from "./grades.js";
import { paintGrain, paintScanlines, paintHalftone, paintVignette, paintFrame } from "./effects.js";
import { drawCaption } from "./lettering.js";
import { rng } from "./state.js";

// Cover-crop math: draw the photo so the panel is filled at the crop's
// centre (cx, cy in 0..1 of the image) and zoom.
export function drawPhoto(ctx, img, r, crop) {
  const scale = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight) * crop.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = r.x + (r.w - dw) * crop.cx;
  const dy = r.y + (r.h - dh) * crop.cy;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Empty panels get an original synth-poster placeholder: dusk gradient,
// low striped sun and palmless horizon lines — never stock art, drawn.
function drawPlaceholder(ctx, r, grade, slotIndex) {
  const { x, y, w, h } = r;
  const rand = rng(4400 + slotIndex * 97);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, grade.palette.deep);
  g.addColorStop(0.62, grade.palette.accent);
  g.addColorStop(1, grade.palette.bright);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  const sunR = Math.min(w, h) * (0.3 + rand() * 0.16);
  const sunX = x + w * (0.35 + rand() * 0.3);
  const sunY = y + h * 0.58;
  const sg = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR);
  sg.addColorStop(0, "#ffffff");
  sg.addColorStop(0.35, grade.palette.bright);
  sg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Retro slice-lines across the lower half of the sun.
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  const cut = Math.max(2, h * 0.012);
  for (let i = 0, yy = sunY + sunR * 0.05; yy < sunY + sunR; i++, yy += cut * (1.6 + i * 0.5)) {
    ctx.fillRect(x, yy, w, cut);
  }
  ctx.restore();

  // Horizon stripes at the base.
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grade.palette.deep;
  for (let i = 1; i <= 5; i++) {
    const yy = y + h * (0.78 + i * 0.04);
    ctx.fillRect(x, yy, w, Math.max(1, h * 0.006));
  }
  ctx.restore();
}

export function paintPoster(ctx, state, W, H) {
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const slots = slotsFor(state.layout);
  const gutter = gutterFor(state.layout, W, H);
  const frameBand = state.finishes.frame ? Math.round(Math.min(W, H) * 0.022) : 0;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grade.palette.deep;
  ctx.fillRect(0, 0, W, H);

  const rects = [];
  for (let i = 0; i < slots.length; i++) {
    const r = pixelRect(slots[i], state.layout, W, H, gutter);
    rects.push(r);

    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();

    const p = state.panels[i];
    const img = p && p.photo >= 0 ? state.photos[p.photo]?.img : null;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.filter = grade.photo;
      drawPhoto(ctx, img, r, p);
      ctx.filter = "none";
    } else {
      drawPlaceholder(ctx, r, grade, i);
    }
    paintOverlays(ctx, grade, r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  // Gutter ink: repaint the deep background along every internal edge.
  if (gutter > 0) {
    ctx.fillStyle = grade.palette.deep;
    for (let i = 1; i < slots.length; i++) {
      const r = rects[i];
      const s = slots[i];
      if (s.x > 0.001) ctx.fillRect(Math.max(0, r.x - Math.floor(gutter / 2)), r.y, gutter, r.h);
      if (s.y > 0.001) ctx.fillRect(r.x, Math.max(0, r.y - Math.floor(gutter / 2)), r.w, gutter);
      if (s.x + s.w < 0.999) ctx.fillRect(r.x + r.w - Math.floor(gutter / 2), r.y, gutter, r.h);
      if (s.y + s.h < 0.999) ctx.fillRect(r.x, r.y + r.h - Math.floor(gutter / 2), r.w, gutter);
    }
  }

  drawCaption(ctx, W, H, grade, state.caption, frameBand);

  if (state.finishes.grain) paintGrain(ctx, W, H);
  if (state.finishes.scanlines) paintScanlines(ctx, W, H);
  if (state.finishes.halftone) paintHalftone(ctx, W, H);
  if (state.finishes.vignette) paintVignette(ctx, W, H, grade.palette.deep);
  if (state.finishes.frame) paintFrame(ctx, W, H, grade.palette.bright);

  ctx.restore();
}

// Render at an exact size into a fresh canvas (used by exports and the
// embed mode); keeps the live preview untouched.
export function renderAt(state, W, H) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  paintPoster(c.getContext("2d"), state, W, H);
  return c;
}
