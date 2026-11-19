// boards.js — Neonpalm project state: post sizes, panel layouts, and the mutable project
// a session edits. Pure data; rendering lives in render.js, the editor shell in booth.js.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'square' },
  '1080x1350': { w: 1080, h: 1350, label: 'portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'wide' },
};

// Every layout is a set of panel frames, fractions of the art area left after the
// caption band. Frames are [x, y, w, h] in unit space; the lettering takes the rest.
// `band` reserves the bottom strip (fraction of height) for the caption.
export const LAYOUTS = {
  quad: {
    label: 'Quartet 2×2',
    band: 0.30,
    frames: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  },
  trio: {
    label: 'Trio collage',
    band: 0.28,
    frames: [
      [0, 0, 0.62, 1],
      [0.62, 0, 0.38, 0.5],
      [0.62, 0.5, 0.38, 0.5],
    ],
  },
  stack: {
    label: 'Stacked trilogy',
    band: 0.26,
    frames: [
      [0, 0, 1, 0.34],
      [0, 0.34, 1, 0.33],
      [0, 0.67, 1, 0.33],
    ],
  },
  split: {
    label: 'Diptych',
    band: 0.30,
    frames: [
      [0, 0, 0.5, 1],
      [0.5, 0, 0.5, 1],
    ],
  },
  banner: {
    label: 'Solo banner',
    band: 0.32,
    frames: [
      [0, 0, 1, 1],
    ],
  },
};

export const GRADES = ['sunset', 'neon', 'heat', 'tide', 'noir'];
export const FINISHES = ['grain', 'scanlines', 'halftone', 'vignette', 'frame'];

// A fresh project: four panels ready for photos, sunset grade, grain + vignette on.
export function freshProject() {
  return {
    size: '1920x1080',
    layout: 'quad',
    grade: 'sunset',
    finishes: { grain: true, scanlines: false, halftone: false, vignette: true, frame: true },
    caption: {
      title: 'PALM CITY',
      sub: 'WELCOME TO THE COAST',
      badge: 'EST. 2026',
      topBand: true,
      bottomBand: true,
    },
    panels: [], // filled by syncPanels when a layout is picked
  };
}

// Give a photo slot to every frame of the current layout, keeping any photo the
// user already placed and its crop, and seeding a default crop for new panels.
export function syncPanels(project, layoutKey) {
  const frames = LAYOUTS[layoutKey].frames;
  const next = [];
  for (let i = 0; i < frames.length; i++) {
    const old = project.panels[i];
    next.push({
      photo: old ? old.photo : null,
      img: old ? old.img : null,
      // crop center in [0,1] image space, zoom relative to cover-fit
      cx: old ? old.cx : 0.5,
      cy: old ? old.cy : 0.5,
      zoom: old ? old.zoom : 1,
      seed: (i * 73 + 11) % 97,
    });
  }
  project.panels = next;
  return project;
}

// Swap a panel's photo and reset its crop to a fresh center-cover.
export function assignPhoto(project, panelIndex, img) {
  const p = project.panels[panelIndex];
  if (!p) return;
  p.photo = img.src;
  p.img = img;
  p.cx = 0.5;
  p.cy = 0.5;
  p.zoom = 1;
}
