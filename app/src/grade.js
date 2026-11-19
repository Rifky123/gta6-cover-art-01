// Colour grades and print finishes. A grade stacks a few full-panel passes: a colour wash with a
// blend mode, a light-leak gradient and a duotone shadow lift. Finishes are the tactile print
// passes (grain, scanlines, halftone, vignette, hairline frame, chroma split).

export const GRADES = {
  sunset: {
    wash: { color: '#ff7a3c', alpha: 0.34, blend: 'overlay' },
    light: { from: '#ffcc66', to: '#ff2d78', alpha: 0.5, blend: 'soft-light', angle: 1.57 },
    lift: { color: '#2a0a3c', alpha: 0.22, blend: 'lighten' },
    caption: ['#ffd76a', '#ff3d6e'],
    accent: '#ff3d6e',
    shadow: '#38001f',
  },
  neon: {
    wash: { color: '#00e0ff', alpha: 0.30, blend: 'overlay' },
    light: { from: '#00ffc8', to: '#ff2df0', alpha: 0.52, blend: 'soft-light', angle: 0.9 },
    lift: { color: '#0b1030', alpha: 0.26, blend: 'lighten' },
    caption: ['#7df9ff', '#ff2df0'],
    accent: '#00ffc8',
    shadow: '#001028',
  },
  heat: {
    wash: { color: '#ff3c1f', alpha: 0.38, blend: 'overlay' },
    light: { from: '#ffb03c', to: '#c8005a', alpha: 0.5, blend: 'soft-light', angle: 1.2 },
    lift: { color: '#3c0400', alpha: 0.24, blend: 'lighten' },
    caption: ['#ffe08a', '#ff3c1f'],
    accent: '#ffb03c',
    shadow: '#2b0000',
  },
  noir: {
    wash: { color: '#8a97ad', alpha: 0.18, blend: 'saturation' },
    light: { from: '#f4f7ff', to: '#20242e', alpha: 0.42, blend: 'soft-light', angle: 1.57 },
    lift: { color: '#101318', alpha: 0.3, blend: 'lighten' },
    caption: ['#f4f7ff', '#8a97ad'],
    accent: '#e8ecf4',
    shadow: '#06070a',
  },
  vice: {
    wash: { color: '#b46bff', alpha: 0.30, blend: 'overlay' },
    light: { from: '#ffe3f9', to: '#0040ff', alpha: 0.46, blend: 'soft-light', angle: 2.1 },
    lift: { color: '#18003c', alpha: 0.24, blend: 'lighten' },
    caption: ['#fff2b0', '#c46bff'],
    accent: '#00e0ff',
    shadow: '#12002b',
  },
  coral: {
    wash: { color: '#ff5e94', alpha: 0.30, blend: 'overlay' },
    light: { from: '#ffd9a0', to: '#3ca6ff', alpha: 0.48, blend: 'soft-light', angle: 2.4 },
    lift: { color: '#2b0a34', alpha: 0.2, blend: 'lighten' },
    caption: ['#ffe9d6', '#ff5e94'],
    accent: '#3ca6ff',
    shadow: '#26101e',
  },
};

export const FINISHES = ['grain', 'scanlines', 'halftone', 'vignette', 'frame', 'chroma'];

/** Seeded PRNG so grain renders identically on every export (determinism). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Grade passes drawn over a clipped panel of x,y,w,h. */
export function applyGrade(ctx, g, x, y, w, h) {
  if (g.wash) {
    ctx.globalCompositeOperation = g.wash.blend;
    ctx.globalAlpha = g.wash.alpha;
    ctx.fillStyle = g.wash.color;
    ctx.fillRect(x, y, w, h);
  }
  if (g.light) {
    const { from, to, angle } = g.light;
    const cx = x + w / 2, cy = y + h / 2;
    const r = Math.max(w, h) * 0.75;
    const grad = ctx.createLinearGradient(
      cx - Math.cos(angle) * r, cy - Math.sin(angle) * r,
      cx + Math.cos(angle) * r, cy + Math.sin(angle) * r,
    );
    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.globalCompositeOperation = g.light.blend;
    ctx.globalAlpha = g.light.alpha;
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
  if (g.lift) {
    ctx.globalCompositeOperation = g.lift.blend;
    ctx.globalAlpha = g.lift.alpha;
    ctx.fillStyle = g.lift.color;
    ctx.fillRect(x, y, w, h);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
