// Caption lettering: big condensed title (the shipped Anton font), gradient
// fill, thick outline and a hard retro shadow, over a gradient band.

const TITLE_FONT = '"Anton", "Arial Black", sans-serif';
const SUB_FONT = '"Anton", "Arial Narrow", sans-serif';

/**
 * Paint the caption block onto the poster.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w poster width
 * @param {number} h poster height
 * @param {{main:string, sub:string, band:string, scale:number}} caption
 * @param {number} margin outer poster margin (px)
 */
export function paintCaption(ctx, w, h, caption, margin) {
  const main = (caption.main || '').trim().toUpperCase();
  const sub = (caption.sub || '').trim().toUpperCase();
  if (!main && !sub) return;
  const scale = caption.scale || 1;
  const atTop = caption.band === 'top';

  const bandH = Math.round(h * 0.30 * scale);
  const bandY = atTop ? 0 : h - bandH;

  // band backdrop: fades in from the art side
  ctx.save();
  const fade = ctx.createLinearGradient(0, atTop ? bandH : bandY, 0, atTop ? 0 : h);
  fade.addColorStop(0, 'rgba(12,3,16,0)');
  fade.addColorStop(0.45, 'rgba(12,3,16,0.62)');
  fade.addColorStop(1, 'rgba(12,3,16,0.88)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.restore();

  // fit the title inside the safe width
  const safe = w - margin * 2;
  let size = Math.min(bandH * 0.5, w * 0.115);
  size = fitSize(ctx, main || sub, size, safe, 0.055);
  const subSize = Math.max(11, size * 0.24);

  // stack: big title toward the band's outer edge, sub line between art and title
  const pad = bandH * 0.12;
  let titleBaseline;
  let subBaseline;
  if (atTop) {
    titleBaseline = bandY + pad + size * 0.82;
    subBaseline = titleBaseline + size * 0.26 + subSize * 1.1;
  } else {
    titleBaseline = h - pad;
    subBaseline = titleBaseline - size * 0.86 - subSize * 0.5;
  }

  if (main) {
    drawTitleLine(ctx, main, w / 2, titleBaseline, size);
  }
  if (sub) {
    drawSubLine(ctx, sub, w / 2, subBaseline, subSize);
  }
}

function fitSize(ctx, text, start, maxWidth, tracking) {
  let size = start;
  for (let i = 0; i < 40 && size > 8; i++) {
    ctx.letterSpacing = `${(size * tracking).toFixed(1)}px`;
    ctx.font = `${size}px ${TITLE_FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size *= 0.94;
  }
  return size;
}

function drawTitleLine(ctx, text, x, baseline, size) {
  const shadowOff = Math.max(3, size * 0.055);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = `${(size * 0.055).toFixed(1)}px`;
  ctx.font = `${size}px ${TITLE_FONT}`;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  // hard drop shadow
  ctx.fillStyle = 'rgba(12,3,16,0.85)';
  ctx.strokeStyle = 'rgba(12,3,16,0.85)';
  ctx.lineWidth = size * 0.09;
  ctx.strokeText(text, x + shadowOff, baseline + shadowOff * 0.6);
  ctx.fillText(text, x + shadowOff, baseline + shadowOff * 0.6);

  // outline
  ctx.strokeStyle = '#1c0a18';
  ctx.lineWidth = size * 0.10;
  ctx.strokeText(text, x, baseline);

  // sunset gradient fill
  const top = baseline - size * 0.82;
  const g = ctx.createLinearGradient(0, top, 0, baseline);
  g.addColorStop(0, '#fff7ea');
  g.addColorStop(0.42, '#ffd98f');
  g.addColorStop(0.72, '#ff8f6b');
  g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g;
  ctx.fillText(text, x, baseline);
  ctx.restore();
}

function drawSubLine(ctx, text, x, baseline, size) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = `${(size * 0.42).toFixed(1)}px`;
  ctx.font = `${size}px ${SUB_FONT}`;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.fillStyle = 'rgba(12,3,16,0.9)';
  ctx.strokeStyle = 'rgba(12,3,16,0.9)';
  ctx.lineWidth = size * 0.22;
  ctx.strokeText(text, x + 2, baseline + 2);
  ctx.fillText(text, x + 2, baseline + 2);
  ctx.strokeStyle = '#241028';
  ctx.lineWidth = size * 0.18;
  ctx.strokeText(text, x, baseline);
  ctx.fillStyle = '#ffe9d2';
  ctx.fillText(text, x, baseline);
  ctx.restore();
}
