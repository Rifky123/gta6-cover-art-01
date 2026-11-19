// Boulevard Press — shared state, a seeded random generator and small helpers.
// Everything the poster draws is derived from this state, and every random
// effect goes through the seeded generator, so the same state always renders
// the same poster.

export const SIZES = {
  wide: { id: 'wide', label: 'Wide 1920\u00d71080', w: 1920, h: 1080 },
  square: { id: 'square', label: 'Square 1080\u00d71080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', label: 'Portrait 1080\u00d71350', w: 1080, h: 1350 },
};

export const SIZE_ORDER = ['wide', 'square', 'portrait'];

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const lerp = (a, b, t) => a + (b - a) * t;

// xorshift32: small, fast, and fully deterministic.
export function rngFrom(seed) {
  let a = (seed | 0) || 0x6d2b79f5;
  return () => {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    return (a >>> 0) / 4294967296;
  };
}

export function blankPanel() {
  return { img: null, name: '', zoom: 1.12, ox: 0, oy: 0 };
}

export function makeState(sizeId = 'wide') {
  return {
    size: sizeId,
    layout: 'quartet',
    grade: 'sundown',
    caption: 'BOULEVARD',
    subline: 'SIX STORIES \u00b7 ONE CITY \u00b7 NO BRAKES',
    topline: 'BOULEVARD PRESS PRESENTS',
    footline: 'AN ORIGINAL COVER \u00b7 MADE WITH BOULEVARD PRESS',
    bands: true,
    finishes: { grain: 0.35, scan: 0.12, dots: 0, vig: 0.45, frame: true },
    panels: [blankPanel(), blankPanel(), blankPanel(), blankPanel()],
    seed: 6102,
  };
}

// Grow or shrink the panel list to a layout's slot count, keeping the photos
// that are already loaded.
export function fitPanels(panels, count) {
  const next = panels.slice(0, count).map((p) => ({ ...p }));
  while (next.length < count) next.push(blankPanel());
  return next;
}

// Random-but-repeatable reframing for one panel.
export function reframe(panel, rng) {
  panel.zoom = 1.06 + rng() * 0.55;
  panel.ox = rng() * 1.6 - 0.8;
  panel.oy = rng() * 1.6 - 0.8;
}

export function shuffleAll(state) {
  const rng = rngFrom(state.seed);
  state.seed = (state.seed * 1103515245 + 12345) & 0x7fffffff;
  for (const p of state.panels) reframe(p, rng);
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

// A one-line event bus so the editor controls and the canvas can stay decoupled.
const listeners = new Map();

export const bus = {
  on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, new Set());
    listeners.get(evt).add(fn);
  },
  emit(evt, arg) {
    const set = listeners.get(evt);
    if (set) for (const fn of set) fn(arg);
  },
};
