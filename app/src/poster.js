// The poster renderer: turns a project (layout, panels, caption, effects)
// plus loaded photos into cover art on any canvas, at any size.

import { buildPanels } from './layouts.js';
import { drawGradedPhoto } from './grades.js';
import { applyEffects } from './texture.js';
import { paintCaption } from './lettering.js';

/**
 * Render the full poster onto a canvas context sized w x h.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {object} project the current editor state
 * @param {Map<string, HTMLImageElement>} photos photo id -> image
 */
export function renderPoster(ctx, w, h, project, photos) {
  const { rects, margin } = buildPanels(w, h, project.layout);

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  paintBackdrop(ctx, w, h);

  project.panels.forEach((spec, i) => {
    const rect = rects[i];
    if (!rect) return;
    const img = photos.get(spec.photoId);
    if (img && img.complete && img.naturalWidth) {
      drawGradedPhoto(ctx, img, rect, spec, spec.grade);
    } else {
      paintEmptyPanel(ctx, rect);
    }
  });

  paintPanelBorders(ctx, rects, w);
  paintWash(ctx, w, h);
  applyEffects(ctx, w, h, activeEffects(project.effects));
  if (project.frame !== 'none') paintFrame(ctx, w, h, margin, project.frame);
  paintCaption(ctx, w, h, project.caption, margin);
  if (printFinishBits > 0) applyPrintFinish(ctx, w, h);
  ctx.restore();
}

// Optional posterize finish: flattens tones so the art reads like a printed
// poster. Off by default; the embed/screenshot mode can switch it on.
let printFinishBits = 0;

export function setPrintFinish(bits) {
  printFinishBits = Math.max(0, Math.min(8, bits));
}

function applyPrintFinish(ctx, w, h) {
  const levels = (1 << printFinishBits) - 1;
  const step = 255 / levels;
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / step) * step);
    data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
  }
  ctx.putImageData(image, 0, 0);
}

export function activeEffects(effects) {
  return Object.entries(effects || {})
    .filter(([, on]) => on)
    .map(([name]) => name);
}

/** Highlight one panel on the preview canvas (editor only, never exported). */
export function paintSelection(ctx, rect, pixelScale) {
  ctx.save();
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(2, 3 * pixelScale);
  ctx.setLineDash([12 * pixelScale, 8 * pixelScale]);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function paintBackdrop(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1a0f22');
  g.addColorStop(1, '#0e0714');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function paintEmptyPanel(ctx, rect) {
  ctx.save();
  ctx.fillStyle = '#241a2b';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(160,143,174,0.5)';
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
  ctx.restore();
}

function paintPanelBorders(ctx, rects, w) {
  ctx.save();
  ctx.strokeStyle = 'rgba(244,236,216,0.92)';
  ctx.lineWidth = Math.max(2, w * 0.0032);
  rects.forEach((r) => ctx.strokeRect(r.x, r.y, r.w, r.h));
  ctx.restore();
}

// one soft sunset wash over everything, so the panels read as one poster
function paintWash(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,140,60,0.30)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,46,136,0.30)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function paintFrame(ctx, w, h, margin, style) {
  const color = style === 'ink' ? 'rgba(16,6,22,0.92)' : 'rgba(244,236,216,0.95)';
  const inset = Math.round(margin * 0.38);
  const tick = Math.round(Math.min(w, h) * 0.055);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.0035);
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.lineWidth = Math.max(3, w * 0.0055);
  const arm = Math.round(tick * 0.9);
  ctx.beginPath();
  ctx.moveTo(inset, inset + arm); ctx.lineTo(inset, inset); ctx.lineTo(inset + arm, inset);
  ctx.moveTo(w - inset - arm, inset); ctx.lineTo(w - inset, inset); ctx.lineTo(w - inset, inset + arm);
  ctx.moveTo(w - inset, h - inset - arm); ctx.lineTo(w - inset, h - inset); ctx.lineTo(w - inset - arm, h - inset);
  ctx.moveTo(inset + arm, h - inset); ctx.lineTo(inset, h - inset); ctx.lineTo(inset, h - inset - arm);
  ctx.stroke();
  ctx.restore();
}
