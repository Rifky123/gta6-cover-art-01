// grade.js — Neonpalm colour grades and print finishes. Every grade paints a translucent
// colour pass over panel art; every finish is a deterministic overlay (seeded noise,
// fixed patterns) so two exports of one project are pixel-identical.

// Each grade: a vertical tint gradient (top colour → bottom colour) blended over the
// photo, plus a filter string Chrome applies while the photo is drawn.
export const GRADE_PASSES = {
  sunset: {
    filter: 'saturate(1.25) contrast(1.06)',
    top: 'rgba(255, 94, 58, 0.42)',
    mid: 'rgba(255, 60, 122, 0.22)',
    bottom: 'rgba(26, 20, 66, 0.34)',
    wash: 'rgba(255, 138, 76, 0.10)',
  },
  neon: {
    filter: 'saturate(1.55) contrast(1.12)',
    top: 'rgba(255, 44, 168, 0.38)',
    mid: 'rgba(112, 0, 255, 0.20)',
    bottom: 'rgba(0, 229, 255, 0.30)',
    wash: 'rgba(64, 220, 255, 0.10)',
  },
  heat: {
    filter: 'saturate(1.35) contrast(1.18) brightness(1.04)',
    top: 'rgba(255, 196, 0, 0.30)',
    mid: 'rgba(255, 84, 0, 0.30)',
    bottom: 'rgba(120, 8, 0, 0.38)',
    wash: 'rgba(255, 120, 40, 0.12)',
  },
  tide: {
    filter: 'saturate(1.1) contrast(1.05)',
    top: 'rgba(0, 210, 255, 0.30)',
    mid: 'rgba(0, 110, 220, 0.22)',
    bottom: 'rgba(10, 16, 60, 0.40)',
    wash: 'rgba(70, 230, 255, 0.08)',
  },
  noir: {
    filter: 'saturate(0.12) contrast(1.3) brightness(0.96)',
    top: 'rgba(255, 255, 255, 0.06)',
    mid: 'rgba(0, 0, 0, 0.10)',
    bottom: 'rgba(0, 0, 0, 0.34)',
    wash: 'rgba(210, 190, 255, 0.05)',
  },
};

// Paint one grade pass over a rect. blend colors with 'overlay' so shadows and
// highlights keep the photo's own contrast.
export function paintGrade(ctx, x, y, w, h, gradeKey) {
  const g = GRADE_PASSES[gradeKey];
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, g.top);
  grad.addColorStop(0.55, g.mid);
  grad.addColorStop(1, g.bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = g.wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// mulberry32 — small deterministic PRNG so grain never changes between exports.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;

// One 96px noise tile, generated once per page at a fixed seed and reused tiled.
function grainPattern(ctx) {
  if (grainTile) return ctx.createPattern(grainTile, 'repeat');
  const c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  const g = c.getContext('2d');
  const img = g.createImageData(96, 96);
  const rnd = mulberry32(0x6c078965);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(rnd() * 72);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return ctx.createPattern(grainTile, 'repeat');
}

export function paintFinishes(ctx, x, y, w, h, finishes, seed) {
  if (finishes.grain) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = grainPattern(ctx);
    ctx.translate(x, y);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (finishes.scanlines) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#000';
    const step = Math.max(3, Math.round(h / 320));
    for (let sy = 0; sy < h; sy += step * 2) ctx.fillRect(x, y + sy, w, step);
    ctx.restore();
  }
  if (finishes.halftone) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#300018';
    const cell = Math.max(10, Math.round(w / 90));
    const rnd = mulberry32(seed ^ 0x9e3779b9);
    for (let hy = cell / 2; hy < h; hy += cell) {
      for (let hx = cell / 2; hx < w; hx += cell) {
        const r = cell * (0.10 + rnd() * 0.16);
        ctx.beginPath();
        ctx.arc(x + hx, y + hy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (finishes.vignette) {
    const vg = ctx.createRadialGradient(
      x + w / 2, y + h / 2, Math.min(w, h) * 0.42,
      x + w / 2, y + h / 2, Math.max(w, h) * 0.74,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,2,14,0.42)');
    ctx.save();
    ctx.fillStyle = vg;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}
