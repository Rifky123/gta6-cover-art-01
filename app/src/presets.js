// Ready-made projects: the demo the app opens with and the shot presets the
// screenshots use. Sample photos are kit assets, free to use.

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square · 1080×1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait · 1080×1350' },
  wide: { w: 1920, h: 1080, label: 'Wide · 1920×1080' },
};

export const SAMPLES = [
  { id: 'boulevard', path: 'samples/boulevard.jpg', name: 'Boulevard' },
  { id: 'pier', path: 'samples/pier.jpg', name: 'Pier' },
];

// focal point / zoom presets reused when one photo fills many panels
const SPREAD = [
  { cx: 0.5, cy: 0.38, zoom: 1.3 },
  { cx: 0.5, cy: 0.55, zoom: 1.0 },
  { cx: 0.32, cy: 0.42, zoom: 1.7 },
  { cx: 0.68, cy: 0.55, zoom: 1.55 },
];

export function makePanels(layout, photoId, gradeCycle) {
  const counts = { solo: 1, diptych: 2, trilogy: 3, quartet: 4 };
  const n = counts[layout] ?? 4;
  return Array.from({ length: n }, (_, i) => ({
    photoId,
    ...SPREAD[i % SPREAD.length],
    grade: gradeCycle[i % gradeCycle.length],
    flip: false,
  }));
}

export function defaultProject() {
  return {
    size: 'portrait',
    layout: 'quartet',
    caption: { main: 'SUNSET HEIST', sub: 'PALM CITY · SUMMER 26', band: 'bottom', scale: 1 },
    panels: [
      { photoId: null, cx: 0.5, cy: 0.4, zoom: 1.2, grade: 'sunset', flip: false },
      { photoId: null, cx: 0.5, cy: 0.5, zoom: 1.0, grade: 'neon', flip: false },
      { photoId: null, cx: 0.5, cy: 0.5, zoom: 1.0, grade: 'gold', flip: false },
      { photoId: null, cx: 0.5, cy: 0.5, zoom: 1.0, grade: 'noir', flip: false },
    ],
    effects: { grain: true, scanlines: false, halftone: false, riso: false, vignette: true },
    frame: 'cream',
  };
}

// The flagship: landscape trilogy showcase for the wide post size.
export function wideShowcase() {
  return {
    size: 'wide',
    layout: 'trilogy',
    caption: { main: 'SUNSET HEIST', sub: 'PALM CITY · SUMMER 26', band: 'bottom', scale: 1 },
    panels: [
      { photoId: 'boulevard', cx: 0.42, cy: 0.3, zoom: 1.28, grade: 'sunset', flip: false },
      { photoId: 'pier', cx: 0.52, cy: 0.34, zoom: 1.28, grade: 'neon', flip: false },
      { photoId: 'boulevard', cx: 0.2, cy: 0.68, zoom: 2.2, grade: 'gold', flip: false },
    ],
    effects: { grain: true, scanlines: false, halftone: false, riso: false, vignette: true },
    frame: 'cream',
  };
}

// Portrait quartet showcase for the 1080 x 1350 post size.
export function portraitShowcase() {
  return {
    size: 'portrait',
    layout: 'quartet',
    caption: { main: 'BOULEVARD QUEEN', sub: 'ONE LAST DRIVE · TONIGHT', band: 'bottom', scale: 1 },
    panels: [
      { photoId: 'boulevard', cx: 0.5, cy: 0.28, zoom: 1.42, grade: 'sunset', flip: false },
      { photoId: 'pier', cx: 0.5, cy: 0.42, zoom: 1.12, grade: 'neon', flip: false },
      { photoId: 'boulevard', cx: 0.38, cy: 0.68, zoom: 1.62, grade: 'gold', flip: false },
      { photoId: 'pier', cx: 0.8, cy: 0.62, zoom: 2.2, grade: 'noir', flip: false },
    ],
    effects: { grain: true, scanlines: false, halftone: false, riso: false, vignette: true },
    frame: 'cream',
  };
}

// Square diptych showcase for the 1080 x 1080 post size.
export function squareShowcase() {
  return {
    size: 'square',
    layout: 'diptych',
    caption: { main: 'PIER PATROL', sub: 'TIDE TURNS AT DAWN', band: 'bottom', scale: 1 },
    panels: [
      { photoId: 'pier', cx: 0.5, cy: 0.36, zoom: 1.2, grade: 'sunset', flip: false },
      { photoId: 'boulevard', cx: 0.5, cy: 0.3, zoom: 1.15, grade: 'neon', flip: false },
    ],
    effects: { grain: true, scanlines: false, halftone: false, riso: false, vignette: true },
    frame: 'cream',
  };
}

export const SHOWCASES = {
  wide: wideShowcase,
  portrait: portraitShowcase,
  square: squareShowcase,
};
