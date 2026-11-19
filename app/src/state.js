// Project state: one mutable object describing the poster, plus the demo seed and the
// auto-varied crops for "fill all panels from one photo".

import { panelCount } from './boards.js';

export const SIZES = [
  { w: 1080, h: 1080 },
  { w: 1080, h: 1350 },
  { w: 1920, h: 1080 },
];

export function freshState() {
  return {
    w: 1080,
    h: 1080,
    layout: 'quartet',
    grade: 'sunset',
    finishes: { grain: true, scanlines: false, halftone: false, vignette: true, frame: false, chroma: false },
    caps: { italic: true, band: true, topbar: true },
    caption: 'PALM DRIVE',
    subline: 'The coast remembers everything',
    photos: [],          // [{ img, name }]
    panels: [],          // [{ photo, fx, fy, z }]
    selected: 0,
  };
}

/** Resync panels when the layout changes, keeping photo assignments where they fit. */
export function retargetPanels(st, layoutId) {
  const n = panelCount(layoutId);
  const old = st.panels;
  st.panels = Array.from({ length: n }, (_, i) =>
    old[i] ? { ...old[i] } : { photo: old.length ? i % Math.max(1, st.photos.length) : -1, fx: 0.5, fy: 0.45, z: 1 },
  );
  st.selected = Math.min(st.selected, n - 1);
}

/** Fill every panel with one photo at deliberately varied crops (zoom + focal point). */
export function fillAll(st, photoIdx) {
  const n = st.panels.length;
  const spots = [
    { fx: 0.5, fy: 0.2, z: 1.0 },
    { fx: 0.4, fy: 0.3, z: 1.3 },
    { fx: 0.6, fy: 0.26, z: 1.5 },
    { fx: 0.5, fy: 0.32, z: 1.85 },
    { fx: 0.32, fy: 0.36, z: 1.2 },
    { fx: 0.7, fy: 0.3, z: 1.65 },
  ];
  st.panels.forEach((p, i) => {
    const s = spots[i % spots.length];
    p.photo = photoIdx;
    p.fx = s.fx;
    p.fy = s.fy;
    p.z = s.z * (1 + Math.floor(i / spots.length) * 0.1);
  });
}

/** Demo seed: two kit sample photos with tuned crops for the screenshot scenes. */
export const DEMO_CROPS = {
  boulevard: { fx: 0.5, fy: 0.26, z: 1.05 },
  pier: { fx: 0.5, fy: 0.3, z: 1.1 },
};
