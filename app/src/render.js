// The poster renderer: photos into panels, grade + finishes, then the caption lettering.
// Deterministic by construction (seeded grain), so an export looks like the live preview.

import { panelRects } from './boards.js';
import { GRADES, applyGrade, mulberry32, FINISHES } from './grade.js';
import { drawCaption, drawTopBar } from './lettering.js';

/** Cover-fit a photo into a rect with a focal point (fx, fy in image units) and zoom. */
function drawPhoto(ctx, img, rect, fx, fy, zoom) {
  const { x, y, w, h } = rect;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const base = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * base, dh = ih * base;
  const cx = x + w / 2, cy = y + h / 2;
  // focal point lands on the panel centre, clamped so the photo always covers the panel
  const ox = Math.min(x, Math.max(x + w - dw, cx - (iw * fx) * base));
  const oy = Math.min(y, Math.max(y + h - dh, cy - (ih * fy) * base));
  ctx.drawImage(img, ox, oy, dw, dh);
}

function placeholder(ctx, rect, accent, seed) {
  const { x, y, w, h } = rect;
  const rnd = mulberry32(seed);
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#1a0f2b');
  grad.addColorStop(1, '#3c1440');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, Math.min(w, h) / 22);
  const stripes = 5;
  for (let i = 0; i < stripes; i++) {
    const t = (i + rnd() * 0.2) / stripes;
    ctx.beginPath();
    ctx.moveTo(x + w * t - h * 0.2, y + h);
    ctx.lineTo(x + w * t + h * 0.35, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = accent;
  ctx.font = `700 ${Math.min(w, h) * 0.07}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PANEL', x + w / 2, y + h / 2);
  ctx.globalAlpha = 1;
}

/** One finish pass, clipped to rect. */
function applyFinish(ctx, name, rect, g, seed, strength) {
  const { x, y, w, h } = rect;
  if (name === 'scanlines') {
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = '#000';
    const step = Math.max(3, Math.round(h / 240));
    for (let sy = y; sy < y + h; sy += step * 2) ctx.fillRect(x, sy, w, step);
    ctx.globalAlpha = 1;
  } else if (name === 'vignette') {
    const rg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = rg;
    ctx.fillRect(x, y, w, h);
  } else if (name === 'halftone') {
    const step = Math.max(6, Math.round(Math.min(w, h) / 110));
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#000';
    const rnd = mulberry32(seed ^ 0x9e37);
    for (let cy = y + step / 2; cy < y + h; cy += step) {
      for (let cx = x + step / 2; cx < x + w; cx += step) {
        const r = step * 0.28 * (0.4 + 0.6 * rnd());
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  } else if (name === 'grain') {
    const tile = 96;
    const off = grainTile(tile, seed);
    ctx.globalAlpha = 0.10 * strength;
    ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(off, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

let grainCache = null;
function grainTile(size, seed) {
  if (grainCache && grainCache.seed === seed) return grainCache.canvas;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c2 = cv.getContext('2d');
  const im = c2.createImageData(size, size);
  const rnd = mulberry32(seed ^ 0x51ed);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = 110 + Math.floor(rnd() * 90);
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
    im.data[i + 3] = 255;
  }
  c2.putImageData(im, 0, 0);
  grainCache = { seed, canvas: cv };
  return cv;
}

/** Main entry: draw the whole poster for the given project state. opts.ui adds editor-only marks. */
export function drawPoster(canvas, st, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = st.w, H = st.h;
  canvas.width = W; canvas.height = H;
  const g = GRADES[st.grade] ?? GRADES.sunset;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = g.shadow;
  ctx.fillRect(0, 0, W, H);

  const rects = panelRects(st.layout, W, H);
  const panelGap = Math.max(3, Math.round(Math.min(W, H) * 0.004));

  rects.forEach((rect, i) => {
    // inset each interior edge by the gap so panels read as separate plates
    const box = {
      x: rect.x + (rect.x > 0 ? panelGap : 0),
      y: rect.y + (rect.y > 0 ? panelGap : 0),
      w: rect.w - (rect.x > 0 ? panelGap : 0) - (rect.x + rect.w < W ? panelGap : 0),
      h: rect.h - (rect.y > 0 ? panelGap : 0),
    };

    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();

    const p = st.panels[i] ?? { photo: -1, fx: 0.5, fy: 0.45, z: 1 };
    const img = p.photo >= 0 ? st.photos[p.photo] : null;
    if (img) {
      if (st.finishes.chroma && opts.chroma !== false) {
        const split = Math.max(2, Math.round(W / 300));
        ctx.globalAlpha = 0.30;
        drawPhoto(ctx, img, box, p.fx, p.fy, p.z);
        ctx.globalCompositeOperation = 'lighten';
        drawPhoto(ctx, img, box, p.fx + split / box.w, p.fy, p.z);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      drawPhoto(ctx, img, box, p.fx, p.fy, p.z);
      applyGrade(ctx, g, box.x, box.y, box.w, box.h);
    } else {
      placeholder(ctx, box, g.accent, 7 + i);
      applyGrade(ctx, g, box.x, box.y, box.w, box.h);
    }
    FINISHES.forEach((f) => {
      if (f === 'frame' || f === 'chroma') return;
      if (st.finishes[f]) applyFinish(ctx, f, box, g, 97 + i * 13, 1);
    });

    // caption band shading sits above panels' lower part
    if (st.caps.band) {
      const bh = Math.round(box.h * 0.16);
      const lg = ctx.createLinearGradient(0, box.y + box.h - bh * 1.6, 0, box.y + box.h);
      lg.addColorStop(0, 'rgba(0,0,0,0)');
      lg.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = lg;
      ctx.fillRect(box.x, box.y + box.h - bh * 1.6, box.w, bh * 1.6);
    }
    ctx.restore();

    // panel frame lines
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.0035));
    ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
    if (st.finishes.frame) {
      ctx.strokeStyle = g.accent;
      ctx.lineWidth = Math.max(1, Math.round(Math.min(W, H) * 0.0012));
      ctx.strokeRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
    }

    if (opts.ui && opts.selected === i) {
      ctx.strokeStyle = '#ffd76a';
      ctx.setLineDash([Math.min(W, H) / 60, Math.min(W, H) / 90]);
      ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.004));
      ctx.strokeRect(box.x + 3, box.y + 3, box.w - 6, box.h - 6);
      ctx.setLineDash([]);
    }
  });

  if (st.caps.topbar) drawTopBar(ctx, W, H, g, st);
  if (st.caps.band) drawCaption(ctx, W, H, g, st);

  if (st.finishes.vignette) {
    const rg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }
}
