// render.js — Neonpalm cover composition. Draws the whole cover for any size: photo
// panels with grade + finishes, caption bands, gradient lettering. Pure canvas, fully
// deterministic — the same project always paints the same pixels.

import { SIZES, LAYOUTS } from './boards.js';
import { paintGrade, paintFinishes } from './grade.js';

const FONT_TITLE = 'Anton';

// Wait until the shipped Anton font is really loaded before the first paint,
// so the preview never falls back to a system face.
export async function readyFont() {
  try {
    await document.fonts.load(`80px "${FONT_TITLE}"`);
    await document.fonts.ready;
  } catch {
    // offline-safe: if FontFaceSet is unavailable we still paint with the loaded face
  }
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Draw one photo into its frame with cover-fit, honoring the panel's crop center
// and zoom. Without a photo, paint a graded skyline placeholder so no panel is empty.
function paintPanel(ctx, frame, panel, artW, artH, grade, px) {
  const [fx, fy, fw, fh] = frame;
  const x = fx * artW;
  const y = fy * artH;
  const w = fw * artW;
  const h = fh * artH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (panel.img && panel.img.complete && panel.img.naturalWidth > 0) {
    const iw = panel.img.naturalWidth;
    const ih = panel.img.naturalHeight;
    // cover-fit scale, times the user's zoom
    const base = Math.max(w / iw, h / ih);
    const s = base * panel.zoom;
    const dw = iw * s;
    const dh = ih * s;
    // crop center in image space, clamped so the frame stays inside the photo
    const dx = x + (w - dw) / 2 + (0.5 - panel.cx) * (dw - w);
    const dy = y + (h - dh) / 2 + (0.5 - panel.cy) * (dh - h);
    ctx.filter = 'saturate(1.15) contrast(1.05)';
    ctx.drawImage(panel.img, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    paintPlaceholder(ctx, x, y, w, h, panel.seed);
  }

  paintGrade(ctx, x, y, w, h, grade);
  paintFinishes(ctx, x, y, w, h, { grain: false, vignette: true }, panel.seed);
  ctx.restore();

  // panel divider glow — the neon seam between panels
  return [x, y, w, h];
}

// A graded vertical dusk placeholder with a palm-silhouette skyline; keeps empty
// panels looking like art instead of holes.
function paintPlaceholder(ctx, x, y, w, h, seed) {
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, '#2b1040');
  sky.addColorStop(0.55, '#8a2f6b');
  sky.addColorStop(0.8, '#ff6a3d');
  sky.addColorStop(1, '#31124a');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // sun
  ctx.fillStyle = 'rgba(255, 210, 120, 0.85)';
  ctx.beginPath();
  ctx.arc(x + w * 0.62, y + h * 0.62, Math.min(w, h) * 0.13, 0, Math.PI * 2);
  ctx.fill();
  // skyline strip
  ctx.fillStyle = 'rgba(12, 6, 24, 0.9)';
  const seedNum = (seed * 31 + 7) % 100 / 100;
  const base = y + h * 0.86;
  for (let i = 0; i < 7; i++) {
    const bw = w * (0.06 + ((seedNum * (i + 3)) % 0.09));
    const bh = h * (0.10 + ((seedNum * (i + 5)) % 0.16));
    const bx = x + w * 0.05 + i * (w * 0.13);
    ctx.fillRect(bx, base - bh, bw, bh);
  }
}

// Paint the caption band: optional badge, huge gradient title with outline, sub-line.
// The block is height-budgeted so nothing can spill past the canvas edge.
function paintCaption(ctx, W, H, caption, bandPx, top) {
  const y0 = top ? 0 : H - bandPx;
  ctx.save();
  const bg = ctx.createLinearGradient(0, y0, 0, y0 + bandPx);
  bg.addColorStop(0, 'rgba(10, 6, 22, 0.94)');
  bg.addColorStop(1, 'rgba(30, 9, 36, 0.88)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, y0, W, bandPx);

  // neon accent rule along the band's inner edge
  const ruleY = top ? bandPx - 3 : y0;
  const rule = ctx.createLinearGradient(0, ruleY, W, ruleY);
  rule.addColorStop(0, '#ff2ca8');
  rule.addColorStop(0.5, '#ffb46b');
  rule.addColorStop(1, '#35d0ff');
  ctx.fillStyle = rule;
  ctx.fillRect(0, ruleY, W, 3);

  const padX = Math.round(W * 0.05);
  const showBadge = !!caption.badge; // top strips are drawn by the caller's slim pass
  const titleH = Math.round(bandPx * 0.48);
  const badgeSize = Math.max(12, Math.round(bandPx * 0.082));
  const subSize = Math.max(13, Math.round(bandPx * 0.115));
  const badgeH = showBadge ? Math.round(bandPx * 0.16) : 0;
  const subH = caption.sub ? Math.round(bandPx * 0.22) : 0;

  // fit the title to the width
  let size = titleH;
  const word = caption.title || '';
  ctx.textBaseline = 'alphabetic';
  for (let tries = 0; tries < 28; tries++) {
    ctx.font = `${size}px "${FONT_TITLE}"`;
    if (ctx.measureText(word).width <= W - padX * 2 || size <= 16) break;
    size = Math.round(size * 0.93);
  }

  // vertical centering of badge + title + sub inside the band
  const blockH = badgeH + size + subH;
  let cy2 = y0 + Math.max(Math.round(bandPx * 0.10), (bandPx - blockH) / 2);

  if (showBadge) {
    ctx.font = `600 ${badgeSize}px "Segoe UI", sans-serif`;
    ctx.fillStyle = 'rgba(255, 180, 107, 0.95)';
    ctx.fillText(spaced(caption.badge.toUpperCase()), padX, cy2 + badgeSize);
    cy2 += badgeH;
  }

  const grad = ctx.createLinearGradient(padX, cy2, W - padX, cy2 + size);
  grad.addColorStop(0, '#ffe86b');
  grad.addColorStop(0.45, '#ff9a5c');
  grad.addColorStop(0.78, '#ff4d9e');
  grad.addColorStop(1, '#c86bff');

  ctx.font = `${size}px "${FONT_TITLE}"`;
  try { ctx.letterSpacing = `${Math.round(size * 0.025)}px`; } catch { /* older engines */ }
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.strokeStyle = 'rgba(8, 4, 18, 0.92)';
  const baseline = cy2 + Math.round(size * 0.82);
  ctx.strokeText(word, padX, baseline);
  ctx.fillStyle = grad;
  ctx.fillText(word, padX, baseline);
  try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
  cy2 += size + (caption.sub ? Math.round(bandPx * 0.10) : 0);

  if (caption.sub) {
    ctx.font = `700 ${subSize}px "Segoe UI", sans-serif`;
    ctx.fillStyle = 'rgba(236, 234, 244, 0.92)';
    ctx.fillText(spaced(caption.sub.toUpperCase()), padX, cy2 + subSize);
  }
  ctx.restore();
}

function spaced(text) {
  return text.split('').join('\u200a\u200a');
}

// Neon seams between panels: dark cut + glowing edge, drawn over the joins.
function paintGutters(ctx, W, H, lay) {
  const seen = new Set();
  const lineW = Math.max(3, Math.round(W * 0.004));
  for (const [fx, fy, fw, fh] of lay.frames) {
    const edges = [
      [fx * W, fy * H, fx * W, (fy + fh) * H],
      [(fx + fw) * W, fy * H, (fx + fw) * W, (fy + fh) * H],
      [fx * W, fy * H, (fx + fw) * W, fy * H],
      [fx * W, (fy + fh) * H, (fx + fw) * W, (fy + fh) * H],
    ];
    for (const [x1, y1, x2, y2] of edges) {
      const key = `${Math.round(x1)},${Math.round(y1)},${Math.round(x2)},${Math.round(y2)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const vertical = x1 === x2;
      // dark cut first, then a warm glow slightly inside
      ctx.strokeStyle = 'rgba(8, 4, 16, 0.85)';
      ctx.lineWidth = lineW;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 170, 90, 0.35)';
      ctx.lineWidth = lineW / 2;
      ctx.beginPath();
      if (vertical) { ctx.moveTo(x1 + lineW, y1); ctx.lineTo(x2 + lineW, y2); }
      else { ctx.moveTo(x1, y1 + lineW); ctx.lineTo(x2, y2 + lineW); }
      ctx.stroke();
    }
  }
}

// Draw the full cover for a project at a given output size. Returns a fresh canvas.
export function paintCover(project, sizeKey) {
  const dims = SIZES[sizeKey] ?? SIZES['1080x1080'];
  const W = dims.w;
  const H = dims.h;
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const lay = LAYOUTS[project.layout];
  const bandPx = Math.round(H * lay.band);
  const artH = H - bandPx;

  // deep backdrop behind the art area
  ctx.fillStyle = '#0a0616';
  ctx.fillRect(0, 0, W, H);

  // panels
  const n = lay.frames.length;
  for (let i = 0; i < n; i++) {
    const panel = project.panels[i] ?? { seed: i };
    paintPanel(ctx, lay.frames[i], panel, W, artH, project.grade, px(project));
  }

  paintGutters(ctx, W, artH, lay);

  // art-area finishes pass over everything
  paintFinishes(ctx, 0, 0, W, artH, project.finishes, 0x5eed1234);

  // outer frame
  if (project.finishes.frame) {
    ctx.strokeStyle = 'rgba(255, 214, 140, 0.85)';
    ctx.lineWidth = Math.max(6, Math.round(W * 0.008));
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, artH - ctx.lineWidth);
  }

  // caption bands
  if (project.caption.bottomBand) paintCaption(ctx, W, H, project.caption, bandPx, false);
  if (project.caption.topBand) {
    // slim top band: badge strip only
    const slim = Math.round(H * 0.055);
    ctx.save();
    ctx.fillStyle = 'rgba(10, 6, 22, 0.82)';
    ctx.fillRect(0, 0, W, slim);
    const rule = ctx.createLinearGradient(0, slim - 2, W, slim - 2);
    rule.addColorStop(0, '#ff2ca8');
    rule.addColorStop(0.5, '#ffb46b');
    rule.addColorStop(1, '#35d0ff');
    ctx.fillStyle = rule;
    ctx.fillRect(0, slim - 2, W, 2);
    ctx.font = `600 ${Math.round(slim * 0.42)}px "Segoe UI", sans-serif`;
    ctx.fillStyle = 'rgba(255, 214, 160, 0.95)';
    ctx.textBaseline = 'middle';
    ctx.fillText(spaced('NEONPALM'), Math.round(W * 0.045), slim / 2);
    ctx.restore();
  }

  return canvas;
}

function px(project) {
  // per-project salt so placeholder art varies per project but stays deterministic
  return project.layout.length * 1013 + project.grade.length * 331;
}
