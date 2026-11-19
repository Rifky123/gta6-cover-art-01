// Boulevard Press — the press itself. One pass over the state paints the
// whole poster: backdrop, panels (photo, grade, plate depth), banner bars,
// caption lettering, print finishes and, in the editor only, the selection
// outline. The same function renders the live preview and every export.

import { SIZES, clamp } from './core.js';
import { slotsFor, bandsFor } from './mosaic.js';
import { gradeById, washLayers } from './wavelength.js';
import { panelDepth, grain, scanlines, halftone, vignette, frame } from './patina.js';
import { drawBands, drawCaption } from './marquee.js';

export function platePath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function placeholder(ctx, r, index) {
  ctx.fillStyle = '#151027';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(246,242,255,0.07)';
  ctx.font = `${Math.round(r.h * 0.5)}px Anton, sans-serif`;
  ctx.fillText(String(index + 1), r.x + r.w / 2, r.y + r.h * 0.46);
  ctx.fillStyle = 'rgba(180,167,214,0.55)';
  ctx.font = `${Math.max(11, Math.round(r.h * 0.05))}px "Segoe UI", sans-serif`;
  ctx.fillText('drop a photo here', r.x + r.w / 2, r.y + r.h * 0.78);
}

function drawPanel(ctx, r, panel, grade, index, borderLw) {
  if (r.w < 2 || r.h < 2) return;
  const radius = Math.max(2, Math.round(Math.min(r.w, r.h) * 0.012));
  const img = panel && panel.img;

  ctx.save();
  platePath(ctx, r.x, r.y, r.w, r.h, radius);
  ctx.clip();

  if (img && img.width) {
    const cover = Math.max(r.w / img.width, r.h / img.height);
    const s = cover * (panel.zoom || 1);
    const dw = img.width * s;
    const dh = img.height * s;
    const slackX = Math.max(0, (dw - r.w) / 2);
    const slackY = Math.max(0, (dh - r.h) / 2);
    const dx = r.x + (r.w - dw) / 2 + clamp(panel.ox, -1, 1) * slackX;
    const dy = r.y + (r.h - dh) / 2 + clamp(panel.oy, -1, 1) * slackY;
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    washLayers(ctx, r, grade);
    panelDepth(ctx, r);
  } else {
    placeholder(ctx, r, index);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(245,241,252,0.85)';
  ctx.lineWidth = borderLw;
  platePath(ctx, r.x + borderLw / 2, r.y + borderLw / 2, r.w - borderLw, r.h - borderLw, radius);
  ctx.stroke();
  ctx.restore();
}

function drawSelection(ctx, rects, selected) {
  const r = rects[selected];
  if (!r) return;
  ctx.save();
  ctx.strokeStyle = '#ffb03c';
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 9]);
  platePath(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  const badge = Math.max(26, Math.round(Math.min(r.w, r.h) * 0.09));
  ctx.fillStyle = '#ffb03c';
  platePath(ctx, r.x + 10, r.y + 10, badge, badge, 6);
  ctx.fill();
  ctx.fillStyle = '#1a0f05';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(badge * 0.55)}px "Segoe UI", sans-serif`;
  ctx.fillText(String(selected + 1), r.x + 10 + badge / 2, r.y + 10 + badge / 2 + 1);
  ctx.restore();
}

export function renderPoster(canvas, state, opts = {}) {
  const size = SIZES[state.size] ?? SIZES.wide;
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);

  // Backdrop: near-black with a faint wash of the grade's accent colour.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0a17');
  bg.addColorStop(1, '#080610');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.72);
  glow.addColorStop(0, `${grade.edge}22`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const bands = state.bands ? bandsFor(H) : { top: 0, bottom: 0 };
  const rects = slotsFor(state.layout, W, H, bands);
  const borderLw = Math.max(2, Math.round(Math.min(W, H) * 0.003));
  rects.forEach((r, i) => drawPanel(ctx, r, state.panels[i], grade, i, borderLw));

  if (state.bands) drawBands(ctx, state, W, H, grade);
  drawCaption(ctx, state, W, H, grade);

  const f = state.finishes;
  scanlines(ctx, W, H, f.scan);
  halftone(ctx, W, H, f.dots);
  grain(ctx, W, H, f.grain, state.seed * 7 + 13);
  vignette(ctx, W, H, f.vig);
  if (f.frame) frame(ctx, W, H, grade);

  if (opts.editor) drawSelection(ctx, rects, opts.selected ?? -1);
  return rects;
}

export function panelAt(rects, x, y) {
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
