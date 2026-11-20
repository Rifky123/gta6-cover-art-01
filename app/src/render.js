// HEATSPLIT poster renderer. Draws the full poster for any size onto a
// 2D canvas: panels (graded photos), caption plate, bands, finishes.
// Deterministic — the grain RNG is seeded, never Math.random-timed.

import { layoutById } from './layouts.js';
import { applyGrade, applyFinish, makeRng } from './grades.js';

export const POSTER_BG = '#0a0a10';

// Draw one photo into a panel rect with reframe (center point 0..1) + zoom.
// cover-fit, then user reframe/zoom; reframe is clamped so the photo never
// uncovers the panel (offset cannot exceed the cover-fit overshoot).
function drawPhoto(ctx, photo, rect, W, H, reframe, zoom) {
  const X = rect.x * W, Y = rect.y * H, PW = rect.w * W, PH = rect.h * H;
  const scale = Math.max(PW / photo.width, PH / photo.height) * zoom;
  const dw = photo.width * scale, dh = photo.height * scale;
  const roomX = Math.max(0, (dw - PW) / 2) / PW;   // allowed offset, panel units
  const roomY = Math.max(0, (dh - PH) / 2) / PH;
  const rx = 0.5 + Math.min(roomX, Math.max(-roomX, reframe.x - 0.5));
  const ry = 0.5 + Math.min(roomY, Math.max(-roomY, reframe.y - 0.5));
  const cx = X + PW / 2 + (rx - 0.5) * PW;
  const cy = Y + PH / 2 + (ry - 0.5) * PH;
  ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
}

// Grade one panel in place via an offscreen copy (getImageData has no
// transform, so region grading happens on a scratch canvas the panel's
// own size).
let scratch = null;
function gradeRegion(ctx, X, Y, PW, PH, grade) {
  const w = Math.ceil(PW), h = Math.ceil(PH);
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
  const sctx = scratch.getContext('2d');
  sctx.clearRect(0, 0, w, h);
  sctx.drawImage(ctx.canvas, Math.floor(X), Math.floor(Y), w, h, 0, 0, w, h);
  applyGrade(sctx, w, h, grade);
  ctx.drawImage(scratch, 0, 0, w, h, Math.floor(X), Math.floor(Y), w, h);
}

// Caption lettering: tall gradient type with outline + sub-line, GTA-poster
// flavor without any Rockstar trade dress.
function drawCaption(ctx, W, H, cap, state) {
  const { title, sub } = cap;
  const baseline = cap.y * H;
  const size = cap.size * H;
  const fam = '"Anton", "Arial Narrow", Impact, sans-serif';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // scrim above the lettering zone so type always reads over art
  const scrim = ctx.createLinearGradient(0, baseline - size * 1.7, 0, baseline);
  scrim.addColorStop(0, 'rgba(6, 2, 10, 0)');
  scrim.addColorStop(1, 'rgba(6, 2, 10, 0.78)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, baseline - size * 1.7, W, size * 1.7);

  // sub-line above the title
  if (sub) {
    ctx.font = `${Math.round(size * 0.16)}px ${fam}`;
    ctx.fillStyle = 'rgba(255, 214, 170, 0.95)';
    ctx.letterSpacing = `${Math.round(size * 0.05)}px`;
    ctx.fillText(sub.toUpperCase(), W / 2, baseline - size * 0.92);
    ctx.letterSpacing = '0px';
  }

  // title: squeeze to fit width
  const maxW = W * 0.9;
  let fs = size;
  ctx.font = `${Math.round(fs)}px ${fam}`;
  const measured = ctx.measureText(title.toUpperCase()).width;
  if (measured > maxW) {
    fs = fs * (maxW / measured);
    ctx.font = `${Math.round(fs)}px ${fam}`;
  }
  const ty = baseline;
  const grad = ctx.createLinearGradient(0, ty - fs, 0, ty + fs * 0.18);
  grad.addColorStop(0, '#ffe9b8');
  grad.addColorStop(0.42, '#ffb545');
  grad.addColorStop(0.72, '#ff4f7e');
  grad.addColorStop(1, '#b01040');

  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(6, fs * 0.055);
  ctx.strokeStyle = 'rgba(20, 4, 12, 0.9)';
  ctx.strokeText(title.toUpperCase(), W / 2, ty);
  ctx.lineWidth = Math.max(3, fs * 0.022);
  ctx.strokeStyle = 'rgba(255, 236, 200, 0.35)';
  ctx.strokeText(title.toUpperCase(), W / 2, ty);
  const grad2 = ctx.createLinearGradient(0, ty - fs, 0, ty + fs * 0.18);
  grad2.addColorStop(0, '#ffe9b8');
  grad2.addColorStop(0.55, '#ffcf6e');
  grad2.addColorStop(1, '#ff7a4f');
  ctx.fillStyle = grad2;
  ctx.fillText(title.toUpperCase(), W / 2, ty);
  ctx.restore();
}

function drawBand(ctx, W, H, band, on) {
  if (!on || !band.text) return;
  const hpx = band.height * H;
  const top = band.atTop ? 0 : H - hpx;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 6, 14, 0.92)';
  ctx.fillRect(0, top, W, hpx);
  ctx.fillStyle = 'rgba(255, 190, 120, 0.9)';
  ctx.fillRect(0, band.atTop ? hpx : top, W, Math.max(2, H * 0.0035));
  ctx.font = `${Math.round(hpx * 0.42)}px "Anton", Impact, sans-serif`;
  ctx.letterSpacing = `${Math.round(hpx * 0.14)}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f2e7ff';
  ctx.fillText(band.text.toUpperCase(), W / 2, top + hpx / 2);
  ctx.restore();
}

export function renderPoster(canvas, state, photos) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = layoutById(state.layout);
  const grade = state.grade;
  const rng = makeRng(state.seed);

  ctx.save();
  ctx.fillStyle = POSTER_BG;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // panels: photo or flat placeholder wash
  layout.panels.forEach((rect, i) => {
    const slot = state.slots[i] ?? { reframe: { x: 0.5, y: 0.5 }, zoom: 1 };
    const photoIdx = slot.photo ?? i % Math.max(1, photos.length);
    const photo = photos[photoIdx];
    const X = rect.x * W, Y = rect.y * H, PW = rect.w * W, PH = rect.h * H;
    if (photo) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(X, Y, PW, PH);
      ctx.clip();
      drawPhoto(ctx, photo, rect, W, H, slot.reframe, slot.zoom);
      ctx.restore();
      gradeRegion(ctx, X, Y, PW, PH, grade);
    } else {
      const g = ctx.createLinearGradient(X, Y, X + PW, Y + PH);
      g.addColorStop(0, '#2c1030');
      g.addColorStop(1, '#51204a');
      ctx.fillStyle = g;
      ctx.fillRect(X, Y, PW, PH);
    }
  });

  // thin separators between panels
  ctx.save();
  ctx.strokeStyle = 'rgba(8, 4, 12, 0.85)';
  ctx.lineWidth = Math.max(2, W * 0.004);
  layout.panels.forEach((r) => {
    ctx.strokeRect(r.x * W, r.y * H, r.w * W, r.h * H);
  });
  ctx.restore();

  // caption + bands
  drawCaption(ctx, W, H, { ...layout.caption, title: state.title, sub: state.sub }, state);
  drawBand(ctx, W, H, { text: state.bandTop, atTop: true, height: 0.062 }, state.bandTopOn);
  drawBand(ctx, W, H, { text: state.bandBottom, atTop: false, height: 0.062 }, state.bandBottomOn);

  // finishes over everything
  for (const f of state.finishes) applyFinish(ctx, W, H, f, rng);
}
