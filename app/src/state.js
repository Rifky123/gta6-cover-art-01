// state.js — the store: one plain object holding the whole poster, plus
// subscription so any change repaints once on the next animation frame.

export const SIZES = {
  square:   { w: 1080, h: 1080, label: "1080 × 1080" },
  portrait: { w: 1080, h: 1350, label: "1080 × 1350" },
  wide:     { w: 1920, h: 1080, label: "1920 × 1080" },
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Small deterministic PRNG (mulberry32) — used for film grain and for
// spreading auto crops, so every render is byte-identical.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Crops used by "fill every panel": spread over the frame so one photo
// yields visibly different panels.
const SPREAD = [
  { cx: 0.50, cy: 0.42, zoom: 1.16 },
  { cx: 0.36, cy: 0.55, zoom: 1.02 },
  { cx: 0.64, cy: 0.50, zoom: 1.30 },
  { cx: 0.46, cy: 0.30, zoom: 1.10 },
  { cx: 0.55, cy: 0.62, zoom: 1.24 },
  { cx: 0.42, cy: 0.44, zoom: 1.06 },
];

export function autoCrops(count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push({ ...SPREAD[i % SPREAD.length] });
  return out;
}

export const state = {
  size: "square",
  layout: "grid",
  grade: "sunset",
  finishes: { grain: true, scanlines: false, halftone: false, vignette: true, frame: true },
  caption: { title: "DUSK RUNNERS", sub: "PALM COAST · AFTER DARK", pos: "bottom", band: true, underline: true, scale: 100 },
  photos: [],   // { name, img (HTMLImageElement), w, h, sample? }
  panels: [     // crops, one per layout slot
    { photo: -1, cx: 0.5, cy: 0.45, zoom: 1.1 },
    { photo: -1, cx: 0.5, cy: 0.45, zoom: 1.1 },
    { photo: -1, cx: 0.5, cy: 0.45, zoom: 1.1 },
    { photo: -1, cx: 0.5, cy: 0.45, zoom: 1.1 },
    { photo: -1, cx: 0.5, cy: 0.45, zoom: 1.1 },
    { photo: -1, cx: 0.5, cy: 0.45, zoom: 1.1 },
  ],
  selected: 0,
};

const listeners = new Set();

export function onChange(fn) { listeners.add(fn); }

let queued = false;
export function touch() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    for (const fn of listeners) fn(state);
  });
}

// Mutate + repaint helpers ----------------------------------------------

export function setSize(size) { state.size = size; touch(); }

export function setLayout(layout) {
  state.layout = layout;
  touch();
}

export function setGrade(grade) { state.grade = grade; touch(); }

export function setFinish(name, on) {
  state.finishes[name] = on;
  touch();
}

export function setCaption(patch) {
  Object.assign(state.caption, patch);
  touch();
}

export function selectPanel(i) {
  state.selected = clamp(i, 0, slotCount() - 1);
  touch();
}

export function slotCount() {
  // Every layout uses at most 6 slots; panels[] is always length 6.
  return 6;
}

export function setPanel(i, patch) {
  Object.assign(state.panels[i], patch);
  touch();
}

// Photos ----------------------------------------------------------------

export function addPhoto(name, img, sample = false) {
  const index = state.photos.length;
  state.photos.push({ name, img, w: img.naturalWidth, h: img.naturalHeight, sample });
  return index;
}

export function removePhoto(index) {
  state.photos.splice(index, 1);
  for (const p of state.panels) {
    if (p.photo === index) p.photo = -1;
    else if (p.photo > index) p.photo -= 1;
  }
  touch();
}

// Assign one photo to every panel with auto-varied crops.
export function fillAll(photoIndex) {
  const crops = autoCrops(state.panels.length);
  state.panels.forEach((p, i) => Object.assign(p, { photo: photoIndex }, crops[i]));
  touch();
}

export function clearPanels() {
  for (const p of state.panels) p.photo = -1;
  touch();
}
