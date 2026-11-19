// Print-style finishes painted over the finished poster. Everything is
// deterministic: the grain tile comes from a fixed-seed generator so two
// renders of the same project are pixel-identical.

export const EFFECTS = [
  { id: 'grain', label: 'Grain' },
  { id: 'scanlines', label: 'Scanlines' },
  { id: 'halftone', label: 'Halftone' },
  { id: 'riso', label: 'Riso shift' },
  { id: 'vignette', label: 'Vignette' },
];

// mulberry32: small, seeded, stable across runs
function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;

function grainPattern(ctx) {
  if (grainTile) return ctx.createPattern(grainTile, 'repeat');
  const size = 96;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  const image = tctx.createImageData(size, size);
  const rand = makeRandom(0x5eed);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 110 + Math.floor(rand() * 90);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  grainTile = tile;
  return ctx.createPattern(tile, 'repeat');
}

export function applyEffects(ctx, w, h, names) {
  const on = new Set(names);
  if (on.has('riso')) paintRisoShift(ctx, w, h);
  if (on.has('halftone')) paintHalftone(ctx, w, h);
  if (on.has('scanlines')) paintScanlines(ctx, w, h);
  if (on.has('grain')) paintGrain(ctx, w, h);
  if (on.has('vignette')) paintVignette(ctx, w, h);
}

function paintGrain(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function paintScanlines(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = '#000';
  const step = 3;
  for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, 1);
  ctx.restore();
}

function paintHalftone(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#12041a';
  const step = 7;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function paintVignette(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.74);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(96,52,88,0.62)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Riso shift: a ghost copy of the whole poster, hue-rotated, drawn a few
// pixels off. Painted from the canvas onto itself, so panels do not need to
// be re-drawn here.
function paintRisoShift(ctx, w, h) {
  const off = Math.max(3, Math.round(w * 0.004));
  const ghost = document.createElement('canvas');
  ghost.width = w;
  ghost.height = h;
  const gctx = ghost.getContext('2d');
  gctx.drawImage(ctx.canvas, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.22;
  ctx.filter = 'hue-rotate(130deg) saturate(1.6)';
  ctx.drawImage(ghost, off, Math.round(off * 0.66));
  ctx.restore();
}
