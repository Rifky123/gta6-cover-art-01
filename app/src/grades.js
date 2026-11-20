// HEATSPLIT colour grades + finishes. A grade is a stack of pixel passes
// applied to each panel's photo before compositing; a finish is a whole-
// poster overlay. All canvas 2D, no filters that would break offline.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    // warm gold mids, magenta accents, deep plum shadows
    shadow: [40, 16, 58],
    mid: [236, 128, 84],
    high: [255, 205, 130],
    lift: 0.07,
    sat: 1.22,
  },
  {
    id: 'neon',
    name: 'Neon',
    // hard magenta/cyan duotone lean
    shadow: [12, 6, 46],
    mid: [228, 52, 148],
    high: [92, 232, 255],
    lift: 0.10,
    sat: 1.32,
  },
  {
    id: 'heat',
    name: 'Heat',
    // molten orange blast, deep brown blacks
    shadow: [40, 14, 8],
    mid: [232, 112, 42],
    high: [255, 216, 140],
    lift: 0.05,
    sat: 1.15,
  },
  {
    id: 'noir',
    name: 'Noir',
    // cold silver mono with crushed blacks
    shadow: [10, 12, 18],
    mid: [132, 136, 146],
    high: [238, 240, 246],
    lift: 0.03,
    sat: 0.0,
    contrast: 1.14,
  },
  {
    id: 'vice',
    name: 'Vice',
    // teal sea + pink sky pop
    shadow: [18, 44, 74],
    mid: [96, 158, 214],
    high: [255, 196, 214],
    lift: 0.08,
    sat: 1.24,
  },
  {
    id: 'gold',
    name: 'Gold',
    // late-afternoon amber, gentle
    shadow: [44, 26, 10],
    mid: [206, 138, 58],
    high: [255, 238, 178],
    lift: 0.06,
    sat: 1.10,
  },
];

export const FINISHES = [
  { id: 'grain', name: 'Grain' },
  { id: 'scanlines', name: 'Scanlines' },
  { id: 'halftone', name: 'Halftone' },
  { id: 'vignette', name: 'Vignette' },
  { id: 'frame', name: 'Frame' },
  { id: 'bloom', name: 'Bloom' },
];

// Deterministic PRNG (mulberry32) so exported PNGs never drift between runs.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Tri-tone map: shadows pull to shadow[], highlights to high[], mids to mid[].
export function applyGrade(ctx, w, h, grade) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const [sr, sg, sb] = grade.shadow;
  const [mr, mg, mb] = grade.mid;
  const [hr, hg, hb] = grade.high;
  const sat = grade.sat ?? 1;
  const con = grade.contrast ?? 1;
  const lift = grade.lift ?? 0;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    // grayscale luminance drives the tri-tone blend
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let tr, tg, tb;
    if (l < 0.5) {
      const t = l / 0.5;
      tr = sr + (mr - sr) * t;
      tg = sg + (mg - sg) * t;
      tb = sb + (mb - sb) * t;
    } else {
      const t = (l - 0.5) / 0.5;
      tr = mr + (hr - mr) * t;
      tg = mg + (hg - mg) * t;
      tb = mb + (hb - mb) * t;
    }
    // mix: keep most of the photo's own chroma, pull the tone map over it
    const mix = 0.46;
    r = r + (tr / 255 - r) * mix;
    g = g + (tg / 255 - g) * mix;
    b = b + (tb / 255 - b) * mix;
    // saturation tweak
    if (sat !== 1) {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = lum + (r - lum) * sat;
      g = lum + (g - lum) * sat;
      b = lum + (b - lum) * sat;
    }
    // contrast around mid grey
    if (con !== 1) {
      r = (r - 0.5) * con + 0.5;
      g = (g - 0.5) * con + 0.5;
      b = (b - 0.5) * con + 0.5;
    }
    // shadow lift for that faded-film toe
    if (lift > 0) {
      r += lift * (1 - r) * 0.35;
      g += lift * (1 - g) * 0.30;
      b += lift * (1 - b) * 0.38;
    }
    d[i] = clamp(r * 255, 0, 255);
    d[i + 1] = clamp(g * 255, 0, 255);
    d[i + 2] = clamp(b * 255, 0, 255);
  }
  ctx.putImageData(img, 0, 0);
}

export function applyFinish(ctx, w, h, finish, rng) {
  switch (finish) {
    case 'grain': {
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (rng() - 0.5) * 26;
        d[i] = clamp(d[i] + n, 0, 255);
        d[i + 1] = clamp(d[i + 1] + n, 0, 255);
        d[i + 2] = clamp(d[i + 2] + n, 0, 255);
      }
      ctx.putImageData(img, 0, 0);
      break;
    }
    case 'scanlines': {
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#000';
      const step = Math.max(3, Math.round(w / 420));
      for (let y = 0; y < h; y += step * 2) ctx.fillRect(0, y, w, step);
      ctx.restore();
      break;
    }
    case 'halftone': {
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = '#16060f';
      const step = Math.max(7, Math.round(w / 150));
      for (let y = 0; y < h; y += step) {
        for (let x = (y / step) % 2 ? step / 2 : 0; x < w; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, step * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      break;
    }
    case 'vignette': {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.74);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(8,2,10,0.5)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'frame': {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,224,170,0.55)';
      ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.006));
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
      ctx.restore();
      break;
    }
    case 'bloom': {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.10;
      ctx.drawImage(ctx.canvas, 0, 0, w, h);
      ctx.restore();
      break;
    }
  }
}
