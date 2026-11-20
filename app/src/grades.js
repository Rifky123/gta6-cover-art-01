// SUNGRID colour grades and print finishes.
// Every grade draws fast canvas composites over a panel photo: no per-pixel loops.

export const GRADES = [
  { id: 'sunset', label: 'Sunset', swatch: '#ff7a3c' },
  { id: 'neon', label: 'Neon', swatch: '#ff36c7' },
  { id: 'heat', label: 'Heat', swatch: '#ff2d2d' },
  { id: 'ice', label: 'Ice', swatch: '#5ad0ff' },
  { id: 'noir', label: 'Noir', swatch: '#9a9a9a' },
  { id: 'day', label: 'Day', swatch: '#ffd97a' },
];

export const FINISHES = [
  { id: 'grain', label: 'Grain' },
  { id: 'scanlines', label: 'Scanlines' },
  { id: 'halftone', label: 'Halftone' },
  { id: 'vignette', label: 'Vignette' },
  { id: 'frame', label: 'Frame' },
];

export const DEFAULT_FINISHES = ['grain', 'vignette', 'frame'];

// Warm dusk wash: orange highlights, magenta-violet shadows.
function sunsetWash(ctx, x, y, w, h) {
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, 'rgba(46,16,92,0.55)');
  sky.addColorStop(0.45, 'rgba(255,90,60,0.34)');
  sky.addColorStop(0.8, 'rgba(255,170,60,0.42)');
  sky.addColorStop(1, 'rgba(255,220,120,0.30)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(255,60,140,0.28)';
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

// Electric duotone: cyan light, magenta shadow.
function neonWash(ctx, x, y, w, h) {
  ctx.globalCompositeOperation = 'overlay';
  const beam = ctx.createLinearGradient(x, y, x, y + h);
  beam.addColorStop(0, 'rgba(0,230,255,0.5)');
  beam.addColorStop(1, 'rgba(255,20,190,0.5)');
  ctx.fillStyle = beam;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(120,0,255,0.35)';
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

function heatWash(ctx, x, y, w, h) {
  ctx.globalCompositeOperation = 'overlay';
  const fire = ctx.createLinearGradient(x, y, x, y + h);
  fire.addColorStop(0, 'rgba(120,0,0,0.45)');
  fire.addColorStop(0.6, 'rgba(255,40,0,0.4)');
  fire.addColorStop(1, 'rgba(255,200,40,0.35)');
  ctx.fillStyle = fire;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

function iceWash(ctx, x, y, w, h) {
  ctx.globalCompositeOperation = 'overlay';
  const cool = ctx.createLinearGradient(x, y, x, y + h);
  cool.addColorStop(0, 'rgba(40,80,200,0.4)');
  cool.addColorStop(1, 'rgba(140,240,255,0.4)');
  ctx.fillStyle = cool;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(220,245,255,0.22)';
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

function noirWash(ctx, x, y, w, h) {
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = '#808080';
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'overlay';
  const ink = ctx.createLinearGradient(x, y, x, y + h);
  ink.addColorStop(0, 'rgba(255,255,255,0.18)');
  ink.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = ink;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

function dayWash(ctx, x, y, w, h) {
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(255,215,130,0.35)';
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'overlay';
  const pop = ctx.createLinearGradient(x, y, x, y + h);
  pop.addColorStop(0, 'rgba(90,160,255,0.22)');
  pop.addColorStop(1, 'rgba(255,180,90,0.22)');
  ctx.fillStyle = pop;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

const WASH = {
  sunset: sunsetWash, neon: neonWash, heat: heatWash,
  ice: iceWash, noir: noirWash, day: dayWash,
};

// Per-grade base filter applied while the photo is drawn.
const DRAW_FILTER = {
  sunset: 'saturate(1.35) contrast(1.06)',
  neon: 'saturate(1.25) contrast(1.12)',
  heat: 'saturate(1.3) contrast(1.08)',
  ice: 'saturate(1.1) contrast(1.05)',
  noir: 'grayscale(1) contrast(1.18) brightness(1.02)',
  day: 'saturate(1.15) contrast(1.02)',
};

export function gradeFilter(id) {
  return DRAW_FILTER[id] || 'none';
}

export function drawWash(ctx, id, x, y, w, h) {
  const wash = WASH[id];
  if (wash) wash(ctx, x, y, w, h);
}

// ---- finishes ----------------------------------------------------------

// One shared noise tile; deterministic seed so exports repeat exactly.
let grainTile = null;
function grainPattern(ctx) {
  if (grainTile && grainTile.owner === ctx) return grainTile.pat;
  const tile = document.createElement('canvas');
  tile.width = 128; tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  let seed = 0x9e3779b9;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = 128 + ((seed >>> 16) / 65535 - 0.5) * 190;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  const pat = ctx.createPattern(tile, 'repeat');
  grainTile = { owner: ctx, pat };
  return pat;
}

let halftoneTile = null;
function halftonePattern(ctx) {
  if (halftoneTile && halftoneTile.owner === ctx) return halftoneTile.pat;
  const tile = document.createElement('canvas');
  const step = 8;
  tile.width = step; tile.height = step;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = 'rgba(0,0,0,0.85)';
  tctx.beginPath();
  tctx.arc(step / 2, step / 2, 1.6, 0, Math.PI * 2);
  tctx.fill();
  const pat = ctx.createPattern(tile, 'repeat');
  halftoneTile = { owner: ctx, pat };
  return pat;
}

export function drawFinish(ctx, id, x, y, w, h, seed = 0) {
  if (id === 'grain') {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = grainPattern(ctx);
    ctx.translate(x, y);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (id === 'scanlines') {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#000';
    const gap = Math.max(3, Math.round(h / 360));
    for (let sy = y; sy < y + h; sy += gap * 2) ctx.fillRect(x, sy, w, gap);
    ctx.restore();
  } else if (id === 'halftone') {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = halftonePattern(ctx);
    ctx.translate(x, y);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (id === 'vignette') {
    ctx.save();
    const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.42, x + w / 2, y + h / 2, Math.max(w, h) * 0.78);
    glow.addColorStop(0, 'rgba(0,0,0,0)');
    glow.addColorStop(1, 'rgba(10,0,24,0.55)');
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  } else if (id === 'frame') {
    ctx.save();
    const t = Math.max(4, Math.round(Math.min(w, h) * 0.012));
    ctx.strokeStyle = 'rgba(255,255,255,0.82)';
    ctx.lineWidth = t;
    ctx.strokeRect(x + t / 2, y + t / 2, w - t, h - t);
    ctx.strokeStyle = 'rgba(255,60,120,0.9)';
    ctx.lineWidth = Math.max(2, t * 0.4);
    const off = t + Math.max(3, t * 0.5);
    ctx.strokeRect(x + off / 2, y + off / 2, w - off, h - off);
    ctx.restore();
  }
  if (seed !== 0) {
    // deterministic sprinkle of light leaks so panels differ
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.1;
    const lx = x + ((seed * 9301 + 49297) % 233280) / 233280 * w;
    const ly = y + ((seed * 49031 + 929) % 233280) / 233280 * h;
    const leak = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.min(w, h) * 0.5);
    leak.addColorStop(0, 'rgba(255,190,120,0.9)');
    leak.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = leak;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}
