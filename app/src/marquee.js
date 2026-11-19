// Boulevard Press — the lettering. The caption wears a vertical ink gradient
// with a fat outline and a hard drop shadow, the tag line sits under it in
// tracked-out caps between rules, and the banner bars frame the poster top
// and bottom. All of it is set in Anton.

import { inkGradient } from './wavelength.js';
import { bandsFor } from './mosaic.js';
import { clamp } from './core.js';

const DISPLAY = 'Anton, "Arial Narrow", Impact, sans-serif';

function diamond(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function trackedLine(ctx, text, x, y, px, tracking, fill) {
  ctx.font = `${px}px ${DISPLAY}`;
  ctx.letterSpacing = `${tracking}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.letterSpacing = '0px';
}

export function drawBands(ctx, state, W, H, grade) {
  const bands = bandsFor(H);
  const edge = grade.edge;

  // Top bar.
  ctx.fillStyle = '#0b0815';
  ctx.fillRect(0, 0, W, bands.top);
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, 'rgba(0,0,0,0)');
  topGrad.addColorStop(0.5, edge);
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, bands.top - 2, W, 2);
  ctx.globalAlpha = 1;

  const topPx = clamp(bands.top * 0.4, 10, 64);
  trackedLine(ctx, state.topline, W / 2, bands.top * 0.54 + 1, topPx, topPx * 0.34, '#f4ecff');
  const topW = ctx.measureText(state.topline).width + topPx * 0.34 * state.topline.length;
  diamond(ctx, W / 2 - topW / 2 - topPx * 1.4, bands.top * 0.54, topPx * 0.22, grade.ink[0]);
  diamond(ctx, W / 2 + topW / 2 + topPx * 1.4, bands.top * 0.54, topPx * 0.22, grade.ink[2]);

  // Bottom bar.
  ctx.fillStyle = '#0b0815';
  ctx.fillRect(0, H - bands.bottom, W, bands.bottom);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, H - bands.bottom, W, 2);
  ctx.globalAlpha = 1;

  const footPx = clamp(bands.bottom * 0.36, 9, 56);
  trackedLine(ctx, state.footline, W / 2, H - bands.bottom * 0.52, footPx, footPx * 0.3, '#c9bde4');
  const footW = ctx.measureText(state.footline).width + footPx * 0.3 * state.footline.length;
  diamond(ctx, W / 2 - footW / 2 - footPx * 1.3, H - bands.bottom * 0.52, footPx * 0.2, grade.ink[2]);
  diamond(ctx, W / 2 + footW / 2 + footPx * 1.3, H - bands.bottom * 0.52, footPx * 0.2, grade.ink[0]);
}

export function drawCaption(ctx, state, W, H, grade) {
  const text = state.caption.trim();
  if (!text) return;

  // Fit the title to the poster: measured at 100px, scaled to fill up to 68%
  // of the width, then capped by height.
  ctx.font = `100px ${DISPLAY}`;
  ctx.letterSpacing = '2px';
  const w100 = Math.max(1, ctx.measureText(text).width);
  ctx.letterSpacing = '0px';
  let px = (100 * (W * 0.68)) / w100;
  px = clamp(px, H * 0.055, H * 0.175);

  const track = px * 0.02;
  const cx = W / 2;
  const cy = H * 0.465; // optical centre of the title block
  const y = cy + px * 0.36; // baseline for cap-height centring

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${px}px ${DISPLAY}`;
  ctx.letterSpacing = `${track}px`;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  // Hard drop shadow, then a fat dark outline, then the ink gradient.
  ctx.fillStyle = 'rgba(8,4,14,0.62)';
  ctx.fillText(text, cx + px * 0.045, y + px * 0.075);
  ctx.strokeStyle = '#150a22';
  ctx.lineWidth = px * 0.055;
  ctx.strokeText(text, cx, y);
  ctx.fillStyle = inkGradient(ctx, grade, y - px * 0.76, y + px * 0.06);
  ctx.fillText(text, cx, y);

  // Tag line under the title, between fading rules. Sized from the title,
  // then shrunk until it fits the poster's width with room to spare.
  if (state.subline.trim()) {
    const sub = state.subline.trim();
    let subPx = clamp(px * 0.17, 11, H * 0.03);
    ctx.font = `${subPx}px ${DISPLAY}`;
    while (subPx > 9 && ctx.measureText(sub).width + subPx * 0.52 * sub.length > W * 0.86) {
      subPx -= 1;
      ctx.font = `${subPx}px ${DISPLAY}`;
    }
    const subTrack = subPx * 0.52;
    const subY = y + px * 0.1 + subPx * 0.9;
    ctx.font = `${subPx}px ${DISPLAY}`;
    ctx.letterSpacing = `${subTrack}px`;
    const subW = ctx.measureText(sub).width;
    ctx.fillStyle = 'rgba(8,4,14,0.55)';
    ctx.fillText(sub, cx + 1.5, subY + 1.5);
    ctx.fillStyle = '#f6f2ff';
    ctx.fillText(sub, cx, subY);
    ctx.letterSpacing = '0px';

    const gap = subW / 2 + subPx * 1.1;
    const reach = W * 0.085;
    for (const sign of [-1, 1]) {
      const x0 = cx + sign * gap;
      const x1 = x0 + sign * (W * 0.5 - gap - reach);
      const rule = ctx.createLinearGradient(x0, 0, x1, 0);
      rule.addColorStop(0, grade.ink[1]);
      rule.addColorStop(1, 'rgba(246,242,255,0)');
      ctx.strokeStyle = rule;
      ctx.lineWidth = Math.max(1.5, subPx * 0.09);
      ctx.beginPath();
      ctx.moveTo(x0, subY - subPx * 0.28);
      ctx.lineTo(x1, subY - subPx * 0.28);
      ctx.stroke();
    }
  }
  ctx.letterSpacing = '0px';
}
