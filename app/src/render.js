// SUNGRID cover renderer — draws the whole poster onto a 2D context.
// Deterministic: no Date/Math.random anywhere in the draw path.

import { layoutById, panelRect, PANEL_GAP } from './layouts.js';
import { gradeFilter, drawWash, drawFinish } from './grades.js';

export const CAPTION_COLORS = [
  { id: 'gold', label: 'Gold', stops: ['#ffe98a', '#ff9d2e', '#ff4d7a'] },
  { id: 'neonpop', label: 'Neon Pop', stops: ['#5df2ff', '#ff4fd8', '#ffd23f'] },
  { id: 'chrome', label: 'Chrome', stops: ['#ffffff', '#b9c4d6', '#6d7688'] },
  { id: 'heat', label: 'Heat', stops: ['#fff1a8', '#ff5c2e', '#a80f3c'] },
  { id: 'ice', label: 'Ice', stops: ['#eafcff', '#8fd8ff', '#3f6dff'] },
  { id: 'noir', label: 'Noir', stops: ['#ffffff', '#cfcfcf', '#585858'] },
];

export function captionColorById(id) {
  return CAPTION_COLORS.find((c) => c.id === id) || CAPTION_COLORS[0];
}

const BAND_FRACTION = 0.085; // band height as a share of poster height

function drawPhoto(ctx, panel, rect, photos) {
  const photo = photos.find((p) => p.id === panel.photoId);
  if (!photo || !photo.img || !photo.img.complete || !photo.img.naturalWidth) {
    ctx.save();
    ctx.fillStyle = '#17171f';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    ctx.restore();
    return;
  }
  const img = photo.img;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const cover = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
  const dw = iw * cover;
  const dh = ih * cover;
  // panel centre shows the image point (cx, cy); clamp so the panel stays covered
  let px = rect.x + rect.w / 2 - (panel.cx || 0.5) * dw;
  let py = rect.y + rect.h / 2 - (panel.cy || 0.5) * dh;
  px = Math.min(rect.x, Math.max(rect.x + rect.w - dw, px));
  py = Math.min(rect.y, Math.max(rect.y + rect.h - dh, py));
  if (dw < rect.w) px = rect.x + (rect.w - dw) / 2;
  if (dh < rect.h) py = rect.y + (rect.h - dh) / 2;
  ctx.drawImage(img, px, py, dw, dh);
}

function drawPanel(ctx, panel, rect, state, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = gradeFilter(state.gradeId);
  drawPhoto(ctx, panel, rect, state.photos);
  ctx.filter = 'none';
  drawWash(ctx, state.gradeId, rect.x, rect.y, rect.w, rect.h);
  for (const f of state.finishes) drawFinish(ctx, f, rect.x, rect.y, rect.w, rect.h, seed);
  ctx.restore();
}

function drawBands(ctx, W, H, caption, bandH) {
  if (!caption.bandOn || bandH <= 0) return;
  for (const top of [true, false]) {
    const y = top ? 0 : H - bandH;
    const grad = ctx.createLinearGradient(0, top ? y : H, 0, top ? bandH : H - bandH);
    const c = captionColorById(caption.colorsId).stops;
    grad.addColorStop(0, top ? 'rgba(8,4,18,0.94)' : 'rgba(8,4,18,0.6)');
    grad.addColorStop(1, top ? 'rgba(8,4,18,0.6)' : 'rgba(8,4,18,0.94)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, bandH);
    const edge = top ? y + bandH - 3 : y;
    ctx.fillStyle = c[1];
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, edge, W, 3);
    ctx.globalAlpha = 1;
    // repeated band text, letter-spaced small caps
    const fs = Math.max(12, Math.round(bandH * 0.3));
    ctx.font = `${fs}px Anton, "Arial Black", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const text = (caption.bandText || 'SUNGRID').toUpperCase();
    const unit = text + '   ·   ';
    const uw = ctx.measureText(unit).width;
    for (let x = 0; x < W + uw; x += uw) {
      ctx.fillText(unit, x - (uw / 2), y + bandH / 2 + 1);
    }
  }
}

// Caption block: gradient title with heavy outline, sub-line beneath.
function drawCaption(ctx, W, H, caption, zoneY, zoneH) {
  const main = (caption.main || '').trim();
  const sub = (caption.sub || '').trim();
  if (!main && !sub) return;
  const colors = captionColorById(caption.colorsId).stops;
  ctx.save();
  ctx.textAlign = 'center';

  const mainSize = Math.max(10, Math.round(
    Math.min(zoneH * 0.56, (W * 0.88) / Math.max(5, main.length * 0.56)),
  ));

  const cx = W / 2;
  // fit by real metrics: shrink until the title fits the canvas width
  ctx.font = `${mainSize}px Anton, "Arial Black", sans-serif`;
  const measured = ctx.measureText(main).width;
  const fitW = W * 0.9;
  const fitted = measured > fitW ? Math.max(10, Math.floor((mainSize * fitW) / measured)) : mainSize;
  const titleSize = fitted;
  const mainY = zoneY + Math.round(zoneH * 0.16) + Math.round(titleSize * 0.9);
  if (main) {
    ctx.font = `${titleSize}px Anton, "Arial Black", sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0c060f';
    ctx.lineWidth = Math.max(6, titleSize * 0.075);
    ctx.strokeText(main, cx, mainY);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = titleSize * 0.07;
    ctx.shadowOffsetY = titleSize * 0.035;
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, titleSize * 0.018);
    ctx.strokeText(main, cx, mainY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const face = ctx.createLinearGradient(0, mainY - mainSize * 0.9, 0, mainY + mainSize * 0.12);
    face.addColorStop(0, colors[0]);
    face.addColorStop(0.55, colors[1]);
    face.addColorStop(1, colors[2]);
    ctx.fillStyle = face;
    ctx.fillText(main, cx, mainY);
  }

  if (sub) {
    const subSize = Math.max(12, Math.round(zoneH * 0.15));
    ctx.font = `${subSize}px Anton, "Arial Black", sans-serif`;
    const subY = zoneY + Math.round(zoneH * 0.9);
    // letter-spaced look: draw with thin spaces between glyphs
    const spaced = sub.toUpperCase().split('').join('\u2009');
    ctx.strokeStyle = 'rgba(8,4,15,0.9)';
    ctx.lineWidth = Math.max(3, subSize * 0.24);
    ctx.strokeText(spaced, cx, subY);
    ctx.fillStyle = colors[0];
    ctx.fillText(spaced, cx, subY);
  }
  ctx.restore();
}

// Entry point: draw the full poster for `state` onto ctx sized W x H.
// Vertical structure: top band, panel collage, caption block, bottom band.
export function renderCover(ctx, W, H, state) {
  ctx.save();
  ctx.fillStyle = '#08060c';
  ctx.fillRect(0, 0, W, H);
  const caption = state.caption;
  const hasCaption = Boolean((caption.main || '').trim() || (caption.sub || '').trim());
  const bandH = caption.bandOn ? Math.round(H * BAND_FRACTION) : 0;
  const capZoneH = hasCaption ? Math.round(H * 0.26) : 0;
  const artY = bandH;
  const artH = Math.max(1, H - bandH * 2 - capZoneH);

  // caption block backdrop: near-black with a tint of the lettering gradient
  if (capZoneH) {
    const colors = captionColorById(caption.colorsId).stops;
    const bg = ctx.createLinearGradient(0, artY + artH, 0, H - bandH);
    bg.addColorStop(0, '#0b0712');
    bg.addColorStop(1, '#0e0818');
    ctx.fillStyle = bg;
    ctx.fillRect(0, artY + artH, W, capZoneH);
    ctx.fillStyle = colors[1];
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, artY + artH, W, 3);
    ctx.globalAlpha = 1;
  }

  // panel collage, clipped to the art area between the bands
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, artY, W, artH);
  ctx.clip();
  ctx.translate(0, artY);
  const layout = layoutById(state.layoutId);
  const panels = layout.panels;
  for (let i = 0; i < panels.length; i++) {
    const panel = state.panels[i] || {};
    const rect = panelRect(panels[i], W, artH, PANEL_GAP);
    drawPanel(ctx, panel, rect, state, i + 1);
  }
  ctx.restore();

  drawBands(ctx, W, H, caption, bandH);
  if (capZoneH) drawCaption(ctx, W, H, caption, artY + artH, capZoneH);
  ctx.restore();
}

// Fill every panel from one photo with auto-varied crops and zoom steps.
export function autoCrops(layoutId, photoId) {
  const layout = layoutById(layoutId);
  const centres = [0.5, 0.35, 0.65, 0.45, 0.6];
  const mids = [0.38, 0.58, 0.3, 0.52, 0.44];
  return layout.panels.map((_, i) => ({
    photoId,
    cx: centres[i % centres.length],
    cy: mids[i % mids.length],
    zoom: 1.1 + (i % 4) * 0.22,
  }));
}
