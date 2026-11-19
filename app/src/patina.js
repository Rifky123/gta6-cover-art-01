// Boulevard Press — print finishes. Grain, scanlines, halftone dots, vignette
// and the border frame, painted over the whole poster so panels, banners and
// lettering all sit under the same film of ink. The grain is generated from a
// seeded generator, so identical settings print identical posters.

import { rngFrom } from './core.js';

function patternCanvas(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d'));
  return c;
}

export function panelDepth(ctx, r) {
  // A soft darkening at a panel's top and bottom edges, like a printed plate.
  const top = ctx.createLinearGradient(0, r.y, 0, r.y + r.h * 0.22);
  top.addColorStop(0, 'rgba(6,3,12,0.26)');
  top.addColorStop(1, 'rgba(6,3,12,0)');
  ctx.fillStyle = top;
  ctx.fillRect(r.x, r.y, r.w, r.h * 0.22);
  const bottom = ctx.createLinearGradient(0, r.y + r.h * 0.76, 0, r.y + r.h);
  bottom.addColorStop(0, 'rgba(6,3,12,0)');
  bottom.addColorStop(1, 'rgba(6,3,12,0.34)');
  ctx.fillStyle = bottom;
  ctx.fillRect(r.x, r.y + r.h * 0.76, r.w, r.h * 0.24);
}

export function grain(ctx, W, H, strength, seed) {
  if (strength <= 0) return;
  const tile = patternCanvas(160, 160, (tctx) => {
    const data = tctx.createImageData(160, 160);
    const rng = rngFrom(seed);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 96 + Math.floor(rng() * 96);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    tctx.putImageData(data, 0, 0);
  });
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = strength * 0.5;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function scanlines(ctx, W, H, alpha) {
  if (alpha <= 0) return;
  const tile = patternCanvas(1, 4, (tctx) => {
    tctx.fillStyle = 'rgba(8,5,16,0.7)';
    tctx.fillRect(0, 0, 1, 1);
    tctx.fillStyle = 'rgba(8,5,16,0.25)';
    tctx.fillRect(0, 1, 1, 1);
  });
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function halftone(ctx, W, H, alpha) {
  if (alpha <= 0) return;
  const tile = patternCanvas(8, 8, (tctx) => {
    tctx.fillStyle = 'rgba(16,10,28,0.9)';
    tctx.beginPath();
    tctx.arc(4, 4, 1.7, 0, Math.PI * 2);
    tctx.fill();
  });
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function vignette(ctx, W, H, strength) {
  if (strength <= 0) return;
  const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.74);
  grad.addColorStop(0, 'rgba(8,4,16,0)');
  grad.addColorStop(1, `rgba(8,4,16,${(strength * 0.9).toFixed(3)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

export function frame(ctx, W, H, grade) {
  const lw = Math.max(2, Math.round(Math.min(W, H) * 0.0035));
  const inset = Math.round(lw * 1.4);
  ctx.save();
  ctx.strokeStyle = 'rgba(246,242,255,0.88)';
  ctx.lineWidth = lw;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  ctx.strokeStyle = grade.edge;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(1, Math.round(lw * 0.42));
  const inset2 = inset + Math.round(lw * 1.15);
  ctx.strokeRect(inset2, inset2, W - inset2 * 2, H - inset2 * 2);
  ctx.restore();
}
